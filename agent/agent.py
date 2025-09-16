import re
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from datetime import datetime
import httpx  # 替代requests，支持异步
import logging
import json
from dis import Instruction
from pydantic import BaseModel, Field, validator
from typing import List, Literal, Optional
import base64
import os
from fastapi import FastAPI, UploadFile, File, HTTPException
import json
import random
import numpy as np
from memory.client.memory import MemoryClient
from common.context import Context
from typing import List, Dict
from tools.utils import * 
from abc import ABC, abstractmethod
from openai import OpenAI
from tools.pdf_reader import *


class BaseAgent(ABC):
    @abstractmethod
    def chat(self, messages: List[dict]):
        pass
    
    @abstractmethod
    def chat_with_tools(self,  messages: List[Dict], tools: List[Dict], model_name: str="", prompt: str="", stream: bool=False):
        pass

    @abstractmethod
    def gen_embedding(self, texts: str, model_name:str):
        pass


class Agent(BaseAgent):
    def __init__(self, model: str="qwen2.5:7b", emb_model_name="nomic-embed-text:latest",tools: List[Dict]=[], timeout: int = 60, context: Context=None) -> None:
        self.model_name = model
        self.emb_model_name = emb_model_name
        self.tools = tools
        self.timeout =timeout 
        self.max_retries = 3
        ollama_url = "http://localhost:11434/v1"
        self.client = OpenAI(
            base_url=ollama_url,  # 注意/v1后缀
            api_key="ollama" , # 任意非空字符串即可
            max_retries=self.max_retries,
        )

        if not context:
            context = Context("../")
        # print("context config: ", context.config)
        self.memory_client = MemoryClient(context)

    async def chat(self, messages: List[dict]) -> str:
        response = self.client.chat.completions.create(
            model=self.model_name,  # 或 gpt-4-turbo
            messages=messages,
            timeout=self.timeout
        )
        return response.choices[0].message.content
    

    async def chat_with_tools(self,  messages: List[Dict], tools: List[Dict], model_name: str="", prompt: str="", stream: bool=False):
        """
        与LLM对话并处理工具调用
        
        :param messages: 对话历史消息
        :param tools: 可用工具列表
        :return: 最终响应内容
        """
        if prompt == "":
            prompt = """
            请严格下面要求回答，不得添加虚构信息：
            要求：
            1. 如果有可以适合的tool call,必须包含tool call返回的信息 且确保真实
            2. 禁止添加任何数据中不存在的信息
            """
        if model_name == "":
            model_name = self.model_name
        
        if tools == []:
            tools = self.tools
        # 第一步：获取LLM初始响应
        response = self.client.chat.completions.create(
            model=model_name,  # 或 gpt-4-turbo
            messages=[
                {
                    "role": "system",
                    "content": prompt
                }
            ]+messages,
            tools=tools['tools_desc'],
            tool_choice="auto",  # 让模型决定是否调用工具
            timeout=self.timeout,
           
        )
        
        response_message = response.choices[0].message
        tool_calls = response_message.tool_calls
        
        # 如果没有工具调用，直接返回响应
        if not tool_calls:
            return response_message.content
        
        # 第二步：处理工具调用
        messages.append(response_message)  # 将LLM的响应添加到对话历史
        
        # 执行所有工具调用
        for tool_call in tool_calls:
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)
            
            # 调用对应的工具函数
            if function_name in tools_dict['tools_func']:
                function_response = tools_dict['tools_func'][function_name](**function_args)
            else:
                function_response = {"error": f"未知工具: {function_name}"}
            
            # 将工具响应添加到对话历史
            messages.append({
                "tool_call_id": tool_call.id,
                "role": "tool",
                "name": function_name,
                "content": json.dumps(function_response),
            })
        
        # 第三步：将工具结果发送给LLM进行总结
        second_response =  self.client.chat.completions.create(
            model=model_name,
            messages=messages,
            stream=stream,
            timeout=self.timeout,
        )
        if stream:
            for chunk in second_response:
                return chunk.choices[0].delta.content

        return second_response.choices[0].message.content
    

    def gen_embedding(self, texts: List[str], model_name:str=""):                
        # 生成embedding
        if model_name == "":
            model_name = self.emb_model_name
        response = self.client.embeddings.create(
            model=model_name,
            input=texts,
            encoding_format="float"  # 可选，默认就是float
        )

        # 获取embedding向量
        embedding =  response.data[0].embedding
        print(f"Embeddings shape: ({ len(response.data)}, { len(response.data[0].embedding)})", type(embedding))
        print(f"model_name: {model_name}")
        print(f"Embedding维度: {len(embedding)}")
        print(f"前5个值: {embedding[:5]}")

        return  [data.embedding for data in response.data]

    def save_embedding(self, embeddings, ids, merge_index=False):
        if not ids:
            print("ids is none, generating random ids")
            ids = [ str(np.random.randint(0, 1000))  for i in range(len(embeddings))]
        print("len of indices: ",len(ids),"embeddings size: ", len(embeddings), ", ", len(embeddings[0]))
        matrix = {
            "embeddings": embeddings,
            "ids": ids
        }
        self.memory_client.faiss_client.insert_vector(matrix, merge_index=merge_index)
        print("vector inserted.")
        ret = self.memory_client.faiss_client.save_index()
        print("save index ret: ",ret)
        return ret



class MultiModalAgent(Agent):
    def __init__(self, model: str = "qwen2.5vl:7b", emb_model_name="nomic-embed-text:latest", tools: List[Dict] = [], timeout: int = 60, context:Context= None) -> None:
        super().__init__(model, emb_model_name, tools, timeout, context)
    def parse_file(self, file_path, output_path=""):
        f"""
        return 
            sections: list of json with keys: title. content, page_numbers, image 
        """
      
        md_parser = MultiFormatParser(file_path, output_path)
        sections, images = md_parser.parse()
        # sections, images = process_pdf_with_images(p,output_directory)
        return sections
    



    

    



if __name__ == "__main__":
    import asyncio
    agent = Agent()

    tools_des =gen_tools_desc([send_email, get_current_weather])
    print("gen_tools_desc: ", tools_des)

    tools_func= {
        "get_current_weather": get_current_weather,
        "send_email": send_email
    }

    tools_dict = {
        "tools_desc": tools_des,
        "tools_func": tools_func
    }

    texts = ["**自然亲近**：如果喜欢大自然，可以直接去附近的公园或绿地感受大自然的美好，比如颐和园、北海公园等等",
    "**尝试美食**：北京是闻名遐迩的美食之都，不妨利用好这个舒适的天气外出品尝当地特色小吃，或是前往有名的餐馆享受一顿丰盛的大餐。",
    "**户外活动**：今天是个不错去公园散步或进行户外运动的好时机，如跑步、骑行或者和家人朋友一起享受明媚阳光下的时光。"
    ]

    # embeddings = asyncio.run( agent.gen_embedding(texts))
    embeddings =  agent.gen_embedding(texts)
    embeddings = np.array(embeddings,np.float32)
    # embeddings = await agent.gen_embedding(texts)
    print("embedding: ", embeddings.shape)

     
    # resp = agent.chat_with_tools([
    #     {
    #         "role": "user",
    #         "content": "我想知道北京的天气。请以celsius单位返回结果给我， 并给一些旅游建议"
    #     }
    # ], tools_dict, "qwen2.5:7b")
    resp = asyncio.run(agent.chat_with_tools([
        {
            "role": "user",
            "content": "我想知道北京的天气。请以celsius单位返回结果给我， 并给一些旅游建议"
        }
    ], tools_dict, "qwen2.5:7b"))

    print("LLM resp:", resp)