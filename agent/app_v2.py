import collections
from heapq import merge
from pickle import NONE
from memory.client.memory import MemoryClient
from common.context import Context
import hashlib

import re
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from datetime import datetime
import httpx  # 替代requests，支持异步
import logging

from dis import Instruction
from pydantic import BaseModel, Field, validator
from typing import List, Literal, Optional
import base64
import os
from fastapi import FastAPI, UploadFile, File, HTTPException
import json
import random
import threading
import time
from agent import *
import asyncio

tmp_data={"maxHp":"10","skill":[{"question":["202304010001","pikaqiu的属性是什么？",1],"answer1":"雷属性","answer2":"高铁属性","answer3":"水属性","correct_answer":"雷属性"},{"question":["202304010002","pikaqiu喜欢看的书籍是什么？",2],"answer1":"钢铁就是力量","answer2":"钢铁是怎样炼成的","answer3":"钢铁的未来","correct_answer":"钢铁就是力量"},{"question":["202304010003","pikaqiu的主人叫什么名字？",3],"answer1":"小k","answer2":"小明","answer3":"小红","correct_answer":"小k"},{"question":["202304010004","pikaqiu的主人是做什么的？",4],"answer1":"算法工程师","answer2":"数据分析师","answer3":"产品经理","correct_answer":"算法工程师"},{"question":["202304010005","pikaqiu的主人喜欢看的书籍是什么？",5],"answer1":"钢铁就是力量","answer2":"钢铁是怎样炼成的","answer3":"钢铁的未来","correct_answer":"钢铁就是力量"},{"question":["202304010006","pikaqiu的主人的主人叫什么名字？",6],"answer1":"小k","answer2":"小明","answer3":"小红","correct_answer":"小k"},{"question":["202304010007","pikaqiu的主人的主人是做什么的？",7],"answer1":"算法工程师","answer2":"数据分析师","answer3":"产品经理","correct_answer":"算法工程师"},{"question":["202304010008","pikaqiu的主人的主人喜欢看的书籍是什么？",8],"answer1":"钢铁就是力量","answer2":"钢铁是怎样炼成的","answer3":"钢铁的未来","correct_answer":"钢铁就是力量"},{"question":["202304010009","pikaqiu的主人的主人的主人叫什么名字？",9],"answer1":"小k","answer2":"小明","answer3":"小红","correct_answer":"小k"},{"question":["202304010010","pikaqiu的主人的主人的主人是做什么的？",10],"answer1":"算法工程师","answer2":"数据分析师","answer3":"产品经理","correct_answer":"算法工程师"},{"question":["202304010011","pikaqiu的主人的主人的主人喜欢看的书籍是什么？",1],"answer1":"钢铁就是力量","answer2":"钢铁是怎样炼成的","answer3":"钢铁的未来","correct_answer":"钢铁就是力量"},{"question":["202304010012","pikaqiu的主人的主人的主人的主人叫什么名字？",2],"answer1":"小k","answer2":"小明","answer3":"小红","correct_answer":"小k"},{"question":["202304010013","pikaqiu的主人的主人的主人的主人是做什么的？",3],"answer1":"算法工程师","answer2":"数据分析师","answer3":"产品经理","correct_answer":"算法工程师"},{"question":["202304010014","pikaqiu的主人的主人的主人的主人喜欢看的书籍是什么？",4],"answer1":"钢铁就是力量","answer2":"钢铁是怎样炼成的","answer3":"钢铁的未来","correct_answer":"钢铁就是力量"},{"question":["202304010015","pikaqiu的主人的主人的主人的主人的主人叫什么名字？",5],"answer1":"小k","answer2":"小明","answer3":"小红","correct_answer":"小k"},{"question":["202304010016","pikaqiu的主人的主人的主人的主人的主人是做什么的？",6],"answer1":"算法工程师","answer2":"数据分析师","answer3":"产品经理","correct_answer":"算法工程师"},{"question":["202304010017","pikaqiu的主人的主人的主人的主人的主人喜欢看的书籍是什么？",7],"answer1":"钢铁就是力量","answer2":"钢铁是怎样炼成的","answer3":"钢铁的未来","correct_answer":"钢铁就是力量"},{"question":["202304010018","pikaqiu的主人的主人的主人的主人的主人的主人叫什么名字？",8],"answer1":"小k","answer2":"小明","answer3":"小红","correct_answer":"小k"},{"question":["202304010019","pikaqiu的主人的主人的主人的主人的主人的主人是做什么的？",9],"answer1":"算法工程师","answer2":"数据分析师","answer3":"产品经理","correct_answer":"算法工程师"},{"question":["202304010020","pikaqiu的主人的主人的主人的主人的主人的主人喜欢看的书籍是什么？",10],"answer1":"钢铁就是力量","answer2":"钢铁是怎样炼成的","answer3":"钢铁的未来","correct_answer":"钢铁就是力量"}],"health_state":"health","attribute":"雷属性","name":"pikaqiu","level":"5","monster_image":"/character_images/placeholder-logo.png"}
# 初始化FastAPI
app = FastAPI(title=" BookMonster Agent API")

# 允许React前端跨域访问
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:8000"],
#     allow_credentials=True,
#     allow_methods=["OPTIONS", "POST", "GET"],
#     allow_headers=["*"],
# )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js 开发服务器
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有 HTTP 方法，包括 OPTIONS
    allow_headers=["*"],  # 允许所有头部
)


def get_ollama_host() -> str:
    """Get the Ollama host from environment variables"""
    return os.getenv("OLLAMA_HOST", "http://localhost:11434")

def get_model_name() -> str:
    """Get the model name from environment variables"""
    return os.getenv("OLLAMA_MODEL", "qwen2.5vl:7b")

def get_chat_model_name() -> str:
    """Get the model name from environment variables"""
    return os.getenv("OLLAMA_CHAT_MODEL", "qwen2.5:3b")

def hash_to_6digit_sha256(s):
    """使用SHA256哈希到6位数字"""
    sha_hash = hashlib.sha256(s.encode()).hexdigest()
    sha_int = int(sha_hash, 16)
    return sha_int % 1000000

# Ollama配置
OLLAMA_BASE_URL = get_ollama_host()
OLLAMA_MODEL = get_model_name()

OLLAMA_CHAT_MODEL = get_chat_model_name()
print("OLLAMA_BASE_URL: ",OLLAMA_BASE_URL)
print("OLLAMA_MODEL: ",OLLAMA_MODEL)
print("OLLAMA_CHAT_MODEL: ",OLLAMA_CHAT_MODEL)
class MonsterState():
    def __init__(self, state=None):
        self.state = {
        "monster_id":"",
        "monster_name": "",
        "monster_image": "",
        "attribute": "",
        "book_name": "",
        "book_id": "",
        "level": 1,
        "exp": 0,
        "maxHp": 100,
        "currentHp": 100,
        "attack": 10,
        "defense": 10,
        "speed": 5,
        "skills": []
        }
        if state:
            self.state.update(state)
        self.used_questions = []

    def update(self, state_dict):
        self.state.update(state_dict)
    def get(self, key):
        return self.state.get(key,"")
    def set_val(self, key, val):
        self.state[key] = val
        return val
    def save_monster_config(self,root_path):
        with open(f"{root_path}/monster_config/{self.get("monster_name")}.json", "w") as f:
            json.dump(self.state, f)
    
    def set_remain_question(self, question_ls):
        self.state['skills'] = question_ls
        return self.state['skills']





class MonsterBrochure():
    def __init__(self,) -> None:
        pwd = os.getcwd()
        root = "/".join(pwd.split("/")[:-1])
        self.monster_data_root = os.path.join(root , "data/character/monster_data/")
        # self.image_root = os.path.join(root , "data/character/images")
        self.image_root = os.path.join(root , "front-end/BookMon-Front-End/public/character_images/")
        self.monster_image_list = []
        for file in os.listdir(self.image_root):
            if file.endswith(".png"):
                self.monster_image_list.append( os.path.join("/character_images/", file))
        print("self.monster_image_list: ",self.monster_image_list)
        self._monster_data = {}

    def load_brochure(self, path):
        if not path:
            path = os.path.join(self.monster_data_root, "init_monsters.jsonl")
        monster_ls = []
        if os.path.exists(path):
            with open(path,"r",encoding='utf-8') as fp:
                for line in fp.readlines():
                    # print("line: ", line)
                    monster_data = json.loads(line)
                    print("monster_data: ",monster_data)
                    monster_ls.append(monster_data)
        return monster_ls

    def udpate_brochure(self, monster_info, save_path=None, save_mode="w+"):
        # when new monsters are genered update monster brochure state adn monster template MonsterState
        if isinstance(monster_info, dict):
            monster_info= [monster_info]
        else:
            print("Expect Type LIST[DICT].  monster_info data type Not Supported: ", type(monster_info))
            return self._monster_data

        for monster_data in monster_info:
            self._monster_data[monster_data['monster_id']] = monster_data
        if save_path:
            self.save_brochure(monster_info, save_path, save_mode)
        return self._monster_data

    def save_brochure(self, data, path="", mode="w+"):
        if not path:
            path = os.path.join(self.monster_data_root, "brochure_monsters.jsonl")
        with open(path,mode,encoding='utf-8') as fp:
            for json_data in data:
                json_data = json.dumps(json_data)
                fp.write(json_data + "\n")
        return os.path.exists(path)




class Player():
    def __init__(self) -> None:
        self.win_cnt= 0
        self.competition_cnt= 0
        self.player_info = {"player_name": "", "player_gender": "", "desc":""}
        self.monsters = {}
        self.cur_monster = {}
        pass



class NPC():
    def __init__(self) -> None:
        self.agent = Agent(model= "qwen2.5:7b", emb_model_name = "nomic-embed-text:latest", tools = [], timeout= 60)
        self.monsters = {}
        pass
    

# class EnvironmentState():
#     def __init__(self) -> None:
#         super().__init__()
#         self.monster_brochure = MonsterBrochure()
#         self.player_monsters_states = {}
#         self.enermy_monsters_states = {}

#         # load player init monster
#         init_path = os.path.join(self.monster_brochure.monster_data_root, "init_monsters.jsonl")
#         init_monster_ls = self.monster_brochure.load_brochure(init_path)
#         # load generated monster
#         path = os.path.join(self.monster_brochure.monster_data_root, "brochure_monsters.jsonl")
#         generated_monster_ls = self.monster_brochure.load_brochure(path)
#         self.monster_brochure.udpate_brochure(init_monster_ls + generated_monster_ls)
#         print("init_monster_ls: ", init_monster_ls)
#         for i, v in enumerate(init_monster_ls):
#             key = v.get("id",i)
#             # print("key: ", key)
#             self.player_monsters_states[key] = MonsterState(v)
        
#         for i, v in enumerate(generated_monster_ls):
#             key = v.get("id",i)
#             self.enermy_monsters_states[key] = MonsterState(v)

        
#         self.player = Player()
#         self.npc = NPC()
#         pwd = os.getcwd()
#         root = "/".join(pwd.split("/")[:-1])
#         context = Context(root)
#         self.generation_agent = MultiModalAgent(model="qwen2.5vl:7b",
#                                 emb_model_name= "nomic-embed-text:latest",
#                                 tools=[],
#                                 timeout= 60,
#                                 context=context) 
#         self.task_queue = collections.defaultdict(list)
#         self.chunk_list = collections.defaultdict(list)
#         self.task_status = collections.defaultdict(dict)
#         # self.enermy_monsters_states.append(MonsterState(tmp_data))
#     def generate_monster(self, prompt):
#         return self.generation_agent.chat(prompt)
#     def load_data(self):
#         # load monster data
#         # load player data
#         return
#     def update_player_state(self):
#         # when player win

#         # when player use tools
#         return

#     def save_states(self):
#         # save generate enemy monsters

#         # save
#         self.monster_brochure.save_brochure() 
#         return
    
#     def compute_per_chunk_data(self, task_id, prompt, chunk, chunk_ids,debug=False):
        
#         template2 =  """
#                     最高优先级要求: 
#                     1. 你只能按照下面的JSON格式输出并填写内容， 不要输出任何非json格式的内容。输出只能是{符合开头,  以}符合结尾
#                     2. 下面用户输入数据里有多个chunk，每个chunk用 ###chunk 区分。例如###chunk1 中chunk1就是当前的chunk id,以此类推。 
#                     3. 请你提取用户输入的内容里的每个chunk内容并总结， 简练提取chunk里面重要观点或信息
#                     3. 基于你提取的重要观点, 对每个chunk id分别生成2条json问答数据然后放到question_ls里面。 并且都是中文形式返回。
#                     4. 每条json里的key只有question, answer1,answer2,answer3,answer4,correct_answer
#                     5. question对应的value 是一个列表，第一位是问题ID, 第二位是问题的内容， 第3位是问题的难度。问题ID通过用时间YYYYMMDDHH+序号的方式拼接去构造确保不会重复。 难度分成1到10个整数等级， 1表示最简单，10表示最难。
#                     6. answer1, answer2,answer3, answer4 对应的value的回答内容不能一样
#                     7.correct_answer 对应的value只返回数值1，2，3，4其中一个值， 代表第几个question是正确答案。 比如"correct_answer": "1"代表question1是正确答案
#                     8. 下面是供你参考的输入格式例子： 
#                     {
#                     "chunk1":
#                             {"question_ls": [{
#                                 "question": ["question_id","content","difficulty"],
#                                 "answer1": "",
#                                 "answer2": "",
#                                 "answer3": "",
#                                 "answer4": "",
#                                 "correct_answer": "1"
#                             }],
#                             },
#                     "chunk2":
#                             {"question_ls": [{
#                                 "question": ["question_id","content","difficulty"],
#                                 "answer1": "",
#                                 "answer2": "",
#                                 "answer3": "",
#                                 "answer4": "",
#                                 "correct_answer": "1"
#                             }],
#                             }
#                     }
                
#                     9. 下面是用户的输入数据：
                    
#             """
#         if len(chunk) != len(chunk_ids):
#             print("len(chunk)  != len(chunk_ids) ", len(chunk) , ", ", len(chunk_ids))
#             return [] 

#         prompt = template2
#         chunk_emb = self.generation_agent.gen_embedding(chunk)
#         chunk_batch = "\n".join(chunk)
#         msg = {'role': "user",
#                     'content': prompt + "\n" + chunk_batch }
#         qa = asyncio.run(self.generation_agent.chat([msg]))
#         # 存储到队列
#         response_str = qa.replace("```json\n", '').replace("```", '')
#         parsed_qa = json.loads(response_str)
#         if not parsed_qa or not chunk_emb  or not response_str:
#             print("Invalid QA from LLM: ", response_str)
#             return []
#         if debug:
#             print("response_str: ",qa)
#             print("chunk_ids: ", chunk_ids)
#             print("parsed repsonse: ", parsed_qa)
#         res = []
#         for i, chunk_id in enumerate(chunk_ids):
#             # filter cases which are ignored by LLM
#             if chunk_id in parsed_qa:
#                 question_ls = parsed_qa[chunk_id].get("question_ls",[])
#                 for v in question_ls:
#                     v["question"][2] = str(v["question"][2])
#                     v["question"][0] = str(v["question"][0])
#                     v['chunk_id'] = str(task_id+"_"+chunk_id).lower()
#                 data = {
#                     "emb_id": str(task_id+"_"+chunk_id).lower(),
#                     "chunk_emb": chunk_emb[i],
#                     "question_ls":question_ls
#                 }
#                 res.append(data)
#         return  res

#     def generate_qa(self, task_id, chunks, prompt, monster_state: MonsterState = None):
#         """模拟大模型分批处理PDF
#         task_id: 对应数据库id 或者名称 用于es 里面的index_name
#         chunks: list of dictionary data
#         prompt: prompt for llm
#         """
#         if task_id not in self.task_queue:
#             self.task_queue[task_id] = []
#         try:
#             print("start generate_qa")
#             # 这里是你的PDF解析逻辑，改为分批处理
#             chunk_batch_ls = []
#             chunk_id_ls = []
#             embeddings_ls = collections.defaultdict(list)
#             batch_size = 2 #不批量处理
#             debug = False
#             for i, chunk in enumerate(chunks):
#                 chunk_id = i+1
#                 chunk['chunk_id'] = f"chunk{chunk_id}"
#                 chunk['task_id'] = str(task_id).lower() 
#                 chunk_data = None
#                 chunk_batch_ls.append( f"###chunk{chunk_id}: \n" + chunk['content'])
#                 chunk_id_ls.append(f"chunk{chunk_id}")
#                 self.chunk_list[task_id].append(chunk)
#                 if chunk_id > 6:
#                     break
#                 # batch processing chunk data to get embedding, embedding ids and question list
#                 try:
#                     if (i%batch_size == 0) or len(chunks) - chunk_id <= batch_size:
#                         print("generating qa when i=",i)
#                         debug = True if i<6 else False
#                         chunk_data = self.compute_per_chunk_data(task_id, prompt, chunk_batch_ls, chunk_id_ls, debug)
#                         chunk_batch_ls.clear()
#                         chunk_id_ls.clear()

#                         # filter invalid data
#                         if not chunk_data:
#                             continue
                    
#                         # parse data
#                         if i <10:
#                             print("chunk_data: ", [[d['question_ls'], d['emb_id'], len(d['chunk_emb'])] for d in chunk_data ])
                        
#                         for data in chunk_data:
#                             emb_id = data['emb_id']
#                             emb = data['chunk_emb']
#                             embeddings_ls["emb_id"].append(emb_id) 
#                             embeddings_ls["chunk_emb"].append(emb) 
#                             self.task_queue[task_id].extend(data['question_ls'])
#                         print(f"Task {task_id} - 已处理 {chunk_id} chunks 和 {len( self.task_queue[task_id])} 条QA")
#                 except Exception as e:
#                     print("Chunk Loop Exception: ", str(e))
#                     if chunk_data and len(chunk_data)>0:
#                         print(" Problem with chunk_data: ", [[d['question_ls'], d['emb_id'], len(d['chunk_emb'])] for d in chunk_data ])
#                     continue
            
#             print(f"task_queue[{task_id}] total size: ", len(self.task_queue[task_id]))
#             # save faiss vectors
#             print("saving embeddings with size: ",len( embeddings_ls['chunk_emb']), "emb_id size: ",len(embeddings_ls["emb_id"]))
#             save_sratue = self.generation_agent.save_embedding( embeddings_ls['chunk_emb'], embeddings_ls["emb_id"], merge_index=False)
            
#             # save generated questions- answers pair to es. Don't save origin text for saving storage
#             print("Saving data to elastic search")
#             doc_dict= {}
#             index_name = str(task_id).lower()
#             for doc_id, doc in enumerate(self.task_queue[task_id]):
#                 doc_dict[doc_id] = doc
#             ret = self.generation_agent.memory_client.es_client.batch_create_doc(index_name, doc_dict)
#             print("QA doc Saved with ret = ", ret)

#             # set question list to monster
#             if monster_state:
#                 monster_state.set_remain_question(self.task_queue[task_id])
#         except Exception as e:
#             print("generate_qa Exception: ", str(e))
#             self.task_status[task_id] = {"error": str(e)}
#         finally:
#             print("finally")
#             self.task_status[task_id] = {"completed": True}
    

#     def parse_llm_result(self,response_str):
#         ret_response = {
#             "maxHp": "",
#             "skill": [{
#             }],
#             "health_state": "health",
#             "attribute": "草属性",
#             "name": "",
#             "level": "1",
#             "monster_image": ""
#         }
#         response_str = response_str.replace("```json\n", '').replace("```", '')
#         paresed_result = json.loads(response_str)
#         print(OLLAMA_MODEL +" Result: " + str(paresed_result))
#         for k in ret_response:
#             if k in paresed_result:
#                 ret_response[k] = paresed_result[k]
#                 if k == 'skill':
#                     skill = ret_response[k]
#                     filter_skill = []
#                     for i in range(len(skill )):
#                         # check if data is valid
#                         if invalidformat(skill[i]):
#                             continue
#                         # print("skill: ", skill[i])
#                         # post-process data
#                         correct_answer_k = "answer"+ str(skill[i]['correct_answer'])
#                         new_qa= {}
#                         new_qa['question'] = skill[i]['question']
#                         if new_qa['question'][0].startswith("question_"):
#                             new_qa['question'][0] = new_qa['question'][0][9:]
#                         correct_answer = skill[i][correct_answer_k]
#                         new_answers = [v for k, v in skill[i].items() if k.startswith("answer") and k!=correct_answer_k]
                                
#                         for j in range(len(new_answers)):
#                             new_qa["answer"+str(j+1)] = new_answers[j]
#                         new_qa['correct_answer'] = correct_answer
#                         filter_skill.append(new_qa)
#                     ret_response[k] = filter_skill
#                 print( k+ ":",  ret_response[k])

#         monster_brochure = gb_state.monster_brochure
#         print("monster_brochure size: ", monster_brochure)
#         if len(monster_brochure.monster_image_list)>0:
#             # random pick image index
#             image_index = random.randint(0, len(monster_brochure.monster_image_list)-1)
#             ret_response["monster_image"] = monster_brochure.monster_image_list[image_index]
#             # print("update: monster_image: ", ret_response['monster_image'])  
#             print()
        
#         return ret_response






class EnvironmentState():
    def __init__(self) -> None:
        super().__init__()
        self.monster_brochure = MonsterBrochure()
        self.player_monsters_states = {}
        self.enermy_monsters_states ={}

        # load player init monster
        init_path = os.path.join(self.monster_brochure.monster_data_root, "init_monsters.jsonl")
        self.init_monster_ls = self.monster_brochure.load_brochure(init_path)
        # # load generated monster
        path = os.path.join(self.monster_brochure.monster_data_root, "brochure_monsters.jsonl")
        self.enemy_monster_ls = self.monster_brochure.load_brochure(path)
        self.enermy_monsters_states = {m['monster_id']:MonsterState(m) for m in self.enemy_monster_ls}
        # self.monster_brochure.udpate_brochure(init_monster_ls + generated_monster_ls)
        # print("init_monster_ls: ", init_monster_ls)
        # for i, v in enumerate(init_monster_ls):
        #     key = v.get("id",i)
        #     # print("key: ", key)
        #     self.player_monsters_states[key] = MonsterState(v)
        
        # for i, v in enumerate(generated_monster_ls):
        #     key = v.get("id",i)
        #     self.enermy_monsters_states[key] = MonsterState(v)

        
        self.player = Player()
        self.npc = NPC()
        pwd = os.getcwd()
        root = "/".join(pwd.split("/")[:-1])
        context = Context(root)
        self.generation_agent = MultiModalAgent(model="qwen2.5vl:7b",
                                emb_model_name= "nomic-embed-text:latest",
                                tools=[],
                                timeout= 60,
                                context=context) 
        self.task_queue = collections.defaultdict(list)
        self.chunk_list = collections.defaultdict(list)
        self.task_status = collections.defaultdict(dict)
    def generate_monster(self, prompt):

        return self.generation_agent.chat(prompt)
    

    def compute_per_chunk_data(self, task_id, prompt, chunk, chunk_ids,debug=False):
        template2 =  """
                    最高优先级要求: 
                    1. 你只能按照下面的JSON格式输出并填写内容， 不要输出任何非json格式的内容。输出只能是{符合开头,  以}符合结尾
                    2. 下面用户输入数据里有多个chunk，每个chunk用 ###chunk 区分。例如###chunk1 中chunk1就是当前的chunk id,以此类推。 
                    3. 请你提取用户输入的内容里的每个chunk内容并总结， 简练提取chunk里面重要观点或信息
                    3. 基于你提取的重要观点, 对每个chunk id分别生成2条json问答数据然后放到question_ls里面。 并且都是中文形式返回。
                    4. 每条json里的key只有question, answer1,answer2,answer3,answer4,correct_answer
                    5. question对应的value 是一个列表，第一位是问题ID, 第二位是问题的内容， 第3位是问题的难度。问题ID通过用时间YYYYMMDDHH+序号的方式拼接去构造确保不会重复。 难度分成1到10个整数等级， 1表示最简单，10表示最难。
                    6. answer1, answer2,answer3, answer4 对应的value的回答内容不能一样
                    7.correct_answer 对应的value只返回数值1，2，3，4其中一个值， 代表第几个question是正确答案。 比如"correct_answer": "1"代表question1是正确答案
                    8. 下面是供你参考的输入格式例子： 
                    {
                    "chunk1":
                            {"question_ls": [{
                                "question": ["question_id","content","difficulty"],
                                "answer1": "",
                                "answer2": "",
                                "answer3": "",
                                "answer4": "",
                                "correct_answer": "1"
                            }],
                            },
                    "chunk2":
                            {"question_ls": [{
                                "question": ["question_id","content","difficulty"],
                                "answer1": "",
                                "answer2": "",
                                "answer3": "",
                                "answer4": "",
                                "correct_answer": "1"
                            }],
                            }
                    }
                
                    9. 下面是用户的输入数据：
                    
            """
        if len(chunk) != len(chunk_ids):
            print("len(chunk)  != len(chunk_ids) ", len(chunk) , ", ", len(chunk_ids))
            return [] 

        prompt = template2
        chunk_emb = self.generation_agent.gen_embedding(chunk)
        chunk_batch = "\n".join(chunk)
        msg = {'role': "user",
                    'content': prompt + "\n" + chunk_batch }
        qa = asyncio.run(self.generation_agent.chat([msg]))
        # 存储到队列
        response_str = qa.replace("```json\n", '').replace("```", '')
        parsed_qa = json.loads(response_str)
        if not parsed_qa or not chunk_emb  or not response_str:
            print("Invalid QA from LLM: ", response_str)
            return []
        if debug:
            print("response_str: ",qa)
            print("chunk_ids: ", chunk_ids)
            print("parsed repsonse: ", parsed_qa)
        res = []
        for i, chunk_id in enumerate(chunk_ids):
            # filter cases which are ignored by LLM
            if chunk_id in parsed_qa:
                question_ls = parsed_qa[chunk_id].get("question_ls",[])
                for v in question_ls:
                    v["question"][2] = str(v["question"][2])
                    v["question"][0] = str(v["question"][0])
                    v['chunk_id'] = str(task_id+"_"+chunk_id).lower()
                data = {
                    "emb_id": str(task_id+"_"+chunk_id).lower(),
                    "chunk_emb": chunk_emb[i],
                    "question_ls":question_ls
                }
                res.append(data)
        return  res


    def generate_qa(self, task_id, chunks, prompt, monster_state: MonsterState = None):
        """模拟大模型分批处理PDF
        task_id: 对应数据库id 或者名称 用于es 里面的index_name
        chunks: list of dictionary data
        prompt: prompt for llm
        """
        if task_id not in self.task_queue:
            self.task_queue[task_id] = []
        try:
            print("start generate_qa")
            # 这里是你的PDF解析逻辑，改为分批处理
            chunk_batch_ls = []
            chunk_id_ls = []
            embeddings_ls = collections.defaultdict(list)
            batch_size = 2 #不批量处理
            debug = False
            for i, chunk in enumerate(chunks):
                chunk_id = i+1
                chunk['chunk_id'] = f"chunk{chunk_id}"
                chunk['task_id'] = str(task_id).lower() 
                chunk_data = None
                chunk_batch_ls.append( f"###chunk{chunk_id}: \n" + chunk['content'])
                chunk_id_ls.append(f"chunk{chunk_id}")
                self.chunk_list[task_id].append(chunk)
                if chunk_id > 6:
                    break
                # batch processing chunk data to get embedding, embedding ids and question list
                try:
                    if (i%batch_size == 0) or len(chunks) - chunk_id <= batch_size:
                        print("generating qa when i=",i)
                        debug = True if i<6 else False
                        chunk_data = self.compute_per_chunk_data(task_id, prompt, chunk_batch_ls, chunk_id_ls, debug)
                        chunk_batch_ls.clear()
                        chunk_id_ls.clear()

                        # filter invalid data
                        if not chunk_data:
                            continue
                    
                        # parse data
                        if i <10:
                            print("chunk_data: ", [[d['question_ls'], d['emb_id'], len(d['chunk_emb'])] for d in chunk_data ])
                        
                        for data in chunk_data:
                            emb_id = data['emb_id']
                            emb = data['chunk_emb']
                            embeddings_ls["emb_id"].append(emb_id) 
                            embeddings_ls["chunk_emb"].append(emb) 
                            self.task_queue[task_id].extend(data['question_ls'])
                        print(f"Task {task_id} - 已处理 {chunk_id} chunks 和 {len( self.task_queue[task_id])} 条QA")
                except Exception as e:
                    print("Chunk Loop Exception: ", str(e))
                    if chunk_data and len(chunk_data)>0:
                        print(" Problem with chunk_data: ", [[d['question_ls'], d['emb_id'], len(d['chunk_emb'])] for d in chunk_data ])
                    continue
            
            print(f"task_queue[{task_id}] total size: ", len(self.task_queue[task_id]))
            # save faiss vectors
            print("saving embeddings with size: ",len( embeddings_ls['chunk_emb']), "emb_id size: ",len(embeddings_ls["emb_id"]))
            save_sratue = self.generation_agent.save_embedding( embeddings_ls['chunk_emb'], embeddings_ls["emb_id"], merge_index=False)
            
            # save generated questions- answers pair to es. Don't save origin text for saving storage
            print("Saving data to elastic search")
            doc_dict= {}
            index_name = str(task_id).lower()
            for doc_id, doc in enumerate(self.task_queue[task_id]):
                doc_dict[doc_id] = doc
            ret = self.generation_agent.memory_client.es_client.batch_create_doc(index_name, doc_dict)
            print("QA doc Saved with ret = ", ret)

            # set question list to monster
            if monster_state:
                monster_state.set_remain_question(self.task_queue[task_id])
        except Exception as e:
            print("generate_qa Exception: ", str(e))
            self.task_status[task_id] = {"error": str(e)}
        finally:
            print("finally")
            self.task_status[task_id] = {"completed": True}
    




gb_state =  EnvironmentState()

# ----------------------
# 1. Ollama对话接口
# ----------------------


class NextAction_Prompt:
    def __init__(self) -> None:
        self.system_prompt = """
你是一个热血神奇宝贝训练家，你的任务在对战中根据自己的神奇宝贝状态以及自己可以选择的动作，选择下一个动作。

下面是你的神奇宝贝状态：
State: {state}
下面是你对手的神奇宝贝的状态
State: {enermy_state}

任务: 你需要根据对手的状态和你自己的状态，从下面的question根据难度里面选择1个问题, 作为攻击手段。
游戏规则：如果对方回答对，那你的角色就会受伤，否则对方玩家的角色会受伤。 越难的问题，你的角色受到的伤害概率越大。
下面你可以选择的问题ID如下, 其中下面列表每一项的函数是 [问题ID, 问题内容, 问题难度]
question_id_list: {action}

另外你也可以和对手说话，通过激将法增加对方压力

"""
        self.format_prompt = """
        格式要求：你必须按照下面JSON格式返回结果， tools=你选择的问题ID, reply=你回应对手的内容
        输出格式例子如下：
        {
            "tools": "问题ID",
            "reply": "我会攻击你"
        }
"""

@app.post("/init_monster")
async def initalize_monster(request: dict):
    """
    调用Ollama的多模态模型生成图片
    注意：需要Ollama已拉取支持多模态的模型（如llava）
    """
    try:
        # load the first monster from json
        print("request: ",request)
        monster_ls = gb_state.init_monster_ls
        res = {"monster": monster_ls}
        print("res = ", res)
        return res
    except Exception as e:
        log_operation("initalize_monster ", str(e), level="error")
        raise HTTPException(status_code=500, detail=str(e))




@app.post("/get_enemy_monster")
async def get_enemy_monster(request: dict):
    """
    调用Ollama的多模态模型生成图片
    注意：需要Ollama已拉取支持多模态的模型（如llava）
    """
    try:
        # load the first monster from json
        print(" get_enemy_monster request: ",request)
        monster_ls = gb_state.enemy_monster_ls
        res = {"monster": monster_ls}
        print("get_enemy_monster res = ", res)
        return res
    except Exception as e:
        log_operation("get_enemy_monster ", str(e), level="error")
        raise HTTPException(status_code=500, detail=str(e))






def encode_base64_content_from_local(content_path: str) -> str:
    with open(content_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read())
    return encoded_string.decode('utf-8')

async def generate_monster_attr(image, text, file_info):
    instruction ="""
    你是一个游戏和书籍专家，能够根据下面书籍的图片内容，以及书籍信息去提取关键信息， 并且根据这些信息生成一个和书籍内容相关的虚拟角色。
    输出格式要求：你必须按照下面JSON格式返回结果， 不要输出任何非json格式的内容。输出只能是{符合开头,  以}符合结尾.下面json值有类型和注释说明值含义

    {
        "monster_id": string, # 通过monster_name hashing得到的id
        "monster_name": string, #角色名称, 不能和book_name一样
        "attribute": string, # 属性：草/火/水/雷/钢/飞行/地面/超能力
        "book_name": string, #每次上传的材料的书名或资料名称
        "book_id": string, #用book_name hashing得到的id，
        "level": number, # 怪物等级5到20
        "exp": number, # 怪物经验: 0-100
        "maxHp": number #最大HP量: 10-100
        "currentHp": number, #当前HP量=maxHp
        "attack": number, #攻击力: 10-100
        "defense": number, #防御力: 10-100
        "speed": number #速度: 5-50
    }

    你需要根据下面的书籍图片和书籍信息，生成一个和书
"""

    instruction +=  text + "\n" + file_info + "\n"
    
    print("generate_monster_attr instruction: ", instruction)
    print("Image: ", image[:30])
    msg =[{
    "role": "user",
    "content": [
    {"type": "text", "text": instruction},
    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image}"}}
    ]
    }]
    monster_attr = await gb_state.generation_agent.chat(msg)
    print("Raw monster_attr: ", monster_attr)
    monster_attr = monster_attr.replace("```json\n", '').replace("```", '')
    monster_attr = json.loads(monster_attr)
    print("generate_monster_attr: ", monster_attr)
    return monster_attr







@app.post("/get_card_list")
async def get_card_list(request : dict):
    """
    request:
        {"book_id": "id"}
    response:
        {"status":"success", msg:"" ,"card_list": [{"card1":{"points":[{"point":"", "difficulty"},{"point":"", "difficulty"}]} }]}
    """
    # return generated  knowledge index list
    #切换到获取知识库tab 时调用
    # result = self.generation_agent.memory_client.es_client.search(index= book_id, keyword=book_id, fields=['_index','_id'])
    # result = self.generation_agent.memory_client.es_client.get_all_documents_search_after(book_id)
    resp = {"status":"success", "msg":"", "card_list":[]}
    print("Get get_card_list request: ", request)
    try:
        book_id = request['book_id']
        result = gb_state.generation_agent.memory_client.es_client._get_all_documents_scroll(book_id)
        resp["msg"]=""
        resp['card_list']= result
        print("get_card_list: ", result)
    except Exception as e:
        logging.error(f"get_card_list failed:  {str(e)}")
        raise HTTPException(status_code=422, detail=f"get_card_list failed:  {str(e)}")
        
    return resp



@app.post("/get_database_list")
async def database_list(request:dict):
    resp = {"status":"success", "msg":"", "index_list":[]}
    print("request: ",request)
    try:
        index_list = gb_state.generation_agent.memory_client.es_client.get_all_index_values()
        # result = []
        # for book_id in index_list:
        #     cards = gb_state.generation_agent.memory_client.es_client._get_all_documents_scroll(book_id)
        #     if len(cards)>0:
        #         result.append({"book_id": book_id, "book_name": cards[0].get('_index_name',""), "description":  cards[0].get('_index_description',"")})
        resp['index_list'] = index_list
        print("database_list: ", index_list)
        return resp
    except Exception as e:
        logging.error(f"Failed to load database list error: {str(e)}")
        raise HTTPException(status_code=422, detail=f"database_list failed:  {str(e)}")
        resp['status'] = "failed"
        resp['msg'] = str(e)
        return resp















@app.post("/generate_bookmonster")
async def generate_bookmonster(request : dict):
    """
    调用Ollama生成回复
    输入request:
        {
            "pdf": "pdf path",
            "image": "image path",
            "description": "description",
            "title": "monster title"
        }
    大模型输出格式：
        {
            "maxHp": "10",
            "skill": [{
                "question": ["question_id","content","difficulty"],
                "answer1": "",
                "answer2": "",
                "answer3": "",
                "answer4": "",
                "correct_answer": "1"
            }],
            "attribute": "",
            "name": "",
            "level": ""
            "monster_image": <image_path>
        }
    最终输出response 格式示例：
    {
      "monster_id": 1,
      "monster_name": "Default书灵",
      "monster_image": "/fire-book-monster.jpg",
      "attribute": "火",
      "book_name": "Default魔法书",
      "book_id": "default_book_001",
      "level": 5,
      "exp": 0,
      "maxHp": 39,
      "currentHp": 39,
      "attack": 52,
      "defense": 43,
      "speed": 65,
      "skills": [
        {
          "question": ["q_fire_1", "default_如何应对水系攻击？", "25"],
          "answer1": "default_使用火系技能",
          "answer2": "default_提高防御",
          "answer3": "default_使用闪避",
          "answer4": "default_使用治疗",
          "correct_answer": "2"
        }
      ]
    }

    """
    ret_response ={
      "monster_id": 1,
      "monster_name": "Default书灵",
      "monster_image": "/fire-book-monster.jpg",
      "attribute": "火",
      "book_name": "Default魔法书",
      "book_id": "default_book_001",
      "level": 5,
      "exp": 0,
      "maxHp": 39,
      "currentHp": 39,
      "attack": 52,
      "defense": 43,
      "speed": 65,
      "skills": []
    }
    
    print("generate monster request: ", request)
    
    try:
        # processing data
        image = request.get("image", "")
        pdf_path = request.get("pdf", "")
        print("parsing image")
        if image.endswith(".png") or image.endswith(".jpg"):
            image_data = encode_base64_content_from_local(image)  
        else:
            image_data = image
        
        print("parsing pdf")
        sections = gb_state.generation_agent.parse_file(pdf_path)
        first_secion = {}
        for sec in sections:
            if sec.get("content",""):
                first_secion = sec
                break
        print("first_secion: ", first_secion)
        
        text = "##用户输入文字或要求: \n" + str(request.get("description", "")) + "\n"
        print("text: ", text)

        file_info = f"""##书籍信息: 书首段title:  {str(first_secion.get("title", ""))} \n
        章节内容:  {str(first_secion.get("content", "")[:200])}\n
        电子书文件名: {str(pdf_path.split("/")[-1])}\n"""

        print("file_info: ", file_info)
        # request llm to generate monster attribute
        monster_attr = await generate_monster_attr(image_data, text, file_info)

        pdf_name = pdf_path.split("/")[-1]
        # hash_id = hash_to_6digit_sha256(monster_attr.get("monster_name", "monster") + pdf_name)
        book_id = hash_to_6digit_sha256(pdf_name)
        monster_attr['book_id'] = "book_"+ str(book_id).zfill(6)
        monster_attr['monster_id'] = str(hash_to_6digit_sha256(monster_attr.get("monster_name", "monster") + str(book_id)))
        monster_attr['book_name'] = pdf_name
        ret_response.update(monster_attr)
        img_root="/home/wwk/workspace/ai_project/BookMonster/front-end/BookMon-Front-End/public/uploads/"
        #随机挑选一张图片
        if os.path.exists(img_root):
            img_files = [p for p in os.listdir(img_root) if p.endswith(".png") or p.endswith(".jpg")]
            image_index = random.randint(0, len(img_files)-1)
            ret_response["monster_image"] = "/uploads/" + os.listdir(img_root)[image_index]
            print("update: monster_image: ", ret_response['monster_image'])
        
        monster_state = MonsterState(ret_response)
        # 生成question answer pair for monster skills
        thread = threading.Thread(target=gb_state.generate_qa, args=(monster_attr['monster_id'], sections, "",monster_state ))
        thread.start()
        

        # save monster data
        
        ret = gb_state.monster_brochure.save_brochure([ret_response], mode="a")
        print("save brochure ret: ", ret)
        gb_state.enermy_monsters_states[monster_attr['monster_id']] = monster_state
        print("ret_response: ", ret_response)
        return ret_response
    except Exception as e:
        log_operation("generate_bookmonster error: ", str(e), level="error")
        raise HTTPException(status_code=500, detail=str(e))






@app.post("/enemy_action")
async def enemy_action(request: Dict):
    """
    request format:
        {
            "monster_id": 和玩家对战的角色id,
            "current_hp": 和玩家对战的角色当前hp,
            "health_state": 和玩家对战的角色当前状态,
            "player_monster_id": 玩家控制的角色id
            "player_hp": 玩家控制的角色当前hp
            "player_state": 玩家控制的角色状态,
            "player_win": False/True 玩家是否答对
        }
    resonse format:{
        "tools":{
            "question": ["question_id","content","difficulty"],
            "answer1": "",
            "answer2": "",
            "answer3": "",
            "answer4": "",
            "correct_answer": "1"
        },
        "reply": ""
    }
         
    """

    response = {
        "tools": {},
        "reply": ""
    }

    decision_prompt ="""
    你是一个热血神奇宝贝训练家，你的任务在对战中根据自己的神奇宝贝状态以及自己可以选择的动作，选择下一个动作。

下面是你的神奇宝贝状态：
State: {state}
下面是你对手的神奇宝贝的状态
State: {enermy_state}

任务: 你需要根据对手的状态和你自己的状态，从下面的question根据难度里面选择1个问题, 作为攻击手段。
游戏规则：如果对方回答对，那你的角色就会受伤，否则对方玩家的角色会受伤。 越难的问题，你的角色受到的伤害概率越大。
下面你可以选择的问题ID如下, 其中下面question_id_list列表含义是 question_id_list:[[问题ID, 问题内容, 问题难度],[问题ID, 问题内容, 问题难度],...]
question_id_list: {action}


另外你也可以和对手说话，通过激将法增加对方压力

"""
    format_prompt = """
        格式要求：你必须按照下面JSON格式返回结果， tools=你选择的问题ID, reply=你回应对手的内容
        输出格式例子如下：
        {
            "tools": "问题ID",
            "reply": "我会攻击你"
        }
        """

    

    async def pick_question(monster_id, enemy_state, player_state):
        import random
        question_data = gb_state.generation_agent.memory_client.es_client._get_all_documents_scroll(str(monster_id))
        if not question_data:
            return {}
        question_ls = [ q["_source"]["doc"] for q in question_data]

        q_idx_map= { q["_source"]["doc"]['question'][0] : idx for idx, q in enumerate(question_data)}
        question_ids = [ int(q["_id"]) for q in question_data]
        action_list = question_ls
        idx_ls = question_ids
        random.shuffle(idx_ls)
        topN=10
        pick_questions = [ str(action_list[i]['question']) for i in idx_ls[:topN]]
        instruction = decision_prompt.format(state=enemy_state
                                    , enermy_state=player_state
                                    , action=str(pick_questions)) + "\n"+ format_prompt
        print("LLM Request Message: ", instruction)

        msg =[{
                "role": "user",
                "content": [{"type": "text", "text": instruction} ]
            }]
        qa = await gb_state.npc.agent.chat(msg)
        result= {}
        print("LLM Response: ", qa)
        # 存储到队列
        try:
            response_str = qa.replace("```json\n", '').replace("```", '')
            response_str = response_str.find("}")!=-1 and response_str[response_str.find("{"):response_str.rfind("}")+1] or response_str
            json_response = json.loads(response_str)
            question_id = json_response.get('tools', '').strip()
            question_id = q_idx_map[question_id]
            reply = json_response.get('reply', '').strip()
            # if question_id not in gb_state.enermy_monsters_states[monster_id].used_questions:
            gb_state.enermy_monsters_states[monster_id].used_questions.append(question_id)                
            # pop 出来的tools 的json格式是 {question:['','',''], answer1:"",answer2:"",answer3:"", correct_answer:""}
            tools = question_ls[question_id]
            print("selected tools: ", tools)
            result['tools']={"question": tools['question'],
                            "answer1": tools['answer1'],
                            "answer2": tools['answer2'],
                            "answer3": tools['answer3'],
                            "answer4": tools['answer4'],
                            "correct_answer": tools['correct_answer']}
            result["reply"] = reply
        except Exception as e:
            print("pick_question Exception: ", str(e))

        return result
    try:
        print("request: ",request)
        monster_id= request["monster_id"]
        player_monster_id= request["player_monster_id"]
        enemy_state = "Your current_hp:" + str(request["current_hp"]) + ", health_state:" + str(request["health_state"]) + "\n"
        print("enemy_state = ",enemy_state)

        player_state =  "player current_hp:" + str(request["player_hp"]) + ", health_state:" + str(request["player_state"]) + ", 玩家是否在上一局获胜:" + str(request["player_win"]) + "\n"
        print("player_state = ",player_state)
        result = await pick_question(monster_id, enemy_state, player_state)
        if not result:
            raise ValueError("No question data found for monster_id: " + str(monster_id) + "result =" + str(result))
        print("pick question result: " , str(result))
        response.update(result)
        print("response =", response)
        return response
    except Exception as e:
        log_operation("enemy_action error: ", str(e), level="error")
        raise HTTPException(status_code=500, detail=str(e))




# @app.post("/enemy_action")
# async def enemy_action(request: Dict):
#     """
#     调用Ollama生成回复
#     输入:
#         {
#             "monster_id": 0,
#             "current_hp": 0,
#             "available_question_ids": ["20230405009", "20230405010"],
#             "health_state": "health"
#         }
#     输出:
#         bookmonster json
#     请求示例：
#     {
#         "tools": question_id,
#         ”reply“: ""
#     }

#     return format:
#         {
#         "action": "attack",
#         "tools": {
#             "question_id": question_id,
#             "question_difficulty": question_difficulty,
#             "question": question,
#             "answer1": answer1,
#             "answer2": answer2,
#             "answer3": answer3,
#             "correct_answer": correct_answer,
#         },
#         "reply": "我会攻击你"
#         }
#     """

#     def get_state(enemy_monster_id, player_monster_id, response):
#         if enemy_monster_id in gb_state.enermy_monsters_states:
#             enemy_monster =  gb_state.enermy_monsters_states[enemy_monster_id]
#             enemy_monster.currentHp = response.get("current_hp", 0)
#             enemy_monster.health_state = response.get("health_state", 0)
#             enemy_monster.currentHp = response.get("current_hp", 0)
#             enemy_state = str(enemy_monster.get_states())
#         else:
#             enemy_monster = None
#             enemy_state = ""
#             print("Failed to find enemy monster: ", enemy_monster_id)
#             return False

#         if player_monster_id in gb_state.player_monsters_states:
#             player_monster = gb_state.player_monsters_states[player_monster_id]
#             player_monster.health_state = response.get("player_health_state", 0)
#             player_monster.currentHp = response.get("player_current_hp", 0)
#             player_state = str(player_monster.get_states())
#         else:
#             player_monster = None
#             player_state = ""
#             print("Failed to find player monster: ", enemy_monster_id)
#             return False
#         return enemy_state, player_state

#     def pick_question(monster_id, enemy_state, player_state):
#         import random
        
#         gb_state.enermy_monsters_states[monster_id]['skills'] = question_ls
#         action_list = gb_state.enermy_monsters_states[monster_id]['skills'] 
#         idx_ls = question_ids
#         random.shuffle(idx_ls)
#         topN=10
#         pick_questions = [action_list[i] for i in range(idx_ls[:topN])]
#         msg = next_action_prompt.system_prompt.format(state=enemy_state
#                                     , enermy_state=player_state
#                                     , action=pick_questions) + "\n"+ next_action_prompt.format_prompt,
#         print("LLM Request Message: ", msg)
#         qa = asyncio.run(gb_state.npc.agent.chat([msg]))
#         result= {}
#         # 存储到队列
#         try:
#             response_str = qa.replace("```json\n", '').replace("```", '')
#             json_response = json.loads(response_str)
#             question_id = json_response.get('tools', '').strip()

            
#             if question_id not in gb_state.enermy_monsters_states[monster_id].used_questions:            # tools = gb_state.enermy_monsters_states[monster_id].remain_question.pop(question_id)

#                 gb_state.enermy_monsters_states[monster_id].used_questions.append(question_id)
#                 tools = question_ls[question_id]
#                 print("selected tools: ", tools)
#                 question_info = tools.pop('question')
#                 tools['question_id'] = question_info[0] if not question_info[0].startswith("questions_") else question_info[0][10:]
#                 tools['question_difficulty'] = question_info[2]
#                 tools['question'] = question_info[1]
#                 result.update(tools)
#         except Exception as e:
#             print("pick_question Exception: ", str(e))

#         return result
    
#     ret_response = {
#         "action": "attack",
#         "tools": {}
#     }
#     print("request: ",request)
#     try:
#         async with httpx.AsyncClient() as client:
#             next_action_prompt = NextAction_Prompt()
#             # 调用Ollama的生成API
#             monster_id= request["monster_id"]
#             player_monster_id= request["player_monster_id"]
#             print("monster_id: ", monster_id)
#             # print("len(gb_state.enermy_monsters_states): ", len(gb_state.enermy_monsters_states))
#             enemy_state, player_state = get_state(monster_id, player_monster_id, request)
#             selected_qa = pick_question(enemy_state, player_state)
#             print(" pick question result: " + str(selected_qa))            
#             ret_response =  {
#                     'status': 'success',
#                     'action': json_response.get('action', 'attack'),
#                     'tools': selected_qa
#                 }
        
#         print("ret_response: ", ret_response)
#         log_operation("Ollama对话", str(ret_response))
#         return ret_response
#     except httpx.HTTPStatusError as e:
#         log_operation("enermy_action错误", f"HTTP错误: {e.response.text}", level="error")
#         raise HTTPException(status_code=e.response.status_code, detail="Ollama服务错误")
#     except Exception as e:
#         log_operation("Ollama错误", str(e), level="error")
#         raise HTTPException(status_code=500, detail=str(e))


# ----------------------
# 2. 文生图接口（适配Ollama多模态模型）
# ----------------------
@app.post("/api/generate-image")
async def generate_image(
    text_prompt: str,
    image: str,
    pdf: str 
    ):
    """
    调用Ollama的多模态模型生成图片
    注意：需要Ollama已拉取支持多模态的模型（如llava）
    """
    try:
        # 处理上传文件
        file_data = None
        if image:
            file_data = await image.read()
        elif pdf:
            file_data = await pdf.read()

        # 构建Ollama请求
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": "llava",  # 多模态模型
                    "prompt": text_prompt,
                    "images": [file_data.hex()] if file_data else None,
                    "stream": False
                }
            )
            result = response.json()

        # 假设返回base64图片（实际需根据模型调整）
        import base64
        image_data = base64.b64decode(result["response"])  # 示例解码逻辑
        image_path = f"generated_images/{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
        with open(image_path, "wb") as f:
            f.write(image_data)

        log_operation("文生图", f"提示词: {text_prompt} | 使用模型: llava")
        return {
            "status": "success",
            "image_url": image_path,
            "model": "llava"
        }

    except Exception as e:
        log_operation("文生图错误", str(e), level="error")
        raise HTTPException(status_code=500, detail=str(e))

# ----------------------
# 3. 日志存储接口（保持不变）
# ----------------------
class LogEntry(BaseModel):
    content: str
    object_id: str = None

@app.post("/api/log")
async def save_log(entry: LogEntry):
    try:
        log_operation("状态日志", entry.content, object_id=entry.object_id)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    


# ----------------------
# 辅助函数
# ----------------------
def log_operation(action: str, details: str, object_id: str = None, level: str = "info"):
    """日志记录到文件和控制台"""
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "action": action,
        "details": details,
        "object_id": object_id
    }
    
    os.makedirs("logs", exist_ok=True)
    log_file = f"logs/operations_{datetime.now().strftime('%Y-%m-%d')}.log"
    
    with open(log_file, "a") as f:
        f.write(f"{log_entry}\n")
    
    getattr(logging, level)(f"{action}: {details}")



# 定义请求模型
class TextRequest(BaseModel):
    prompt: str
    model: str = "qwen2.5-vl:7b"
    stream: bool = False

class ImageRequest(BaseModel):
    prompt: str
    model: str
    images: List[str]  # Base64 编码的图片列表
    stream: bool = False


class GenerateRequest(BaseModel):
    is_player: bool = False
    title: Optional[str] = ""
    description: Optional[str] = ""
    prompt: Optional[str] = ""
    model: Optional[str] = "qwen2.5-vl:7b"
    stream: bool = False
    images: Optional[list[str]] = [] 
    file_path: Optional[str] = ""

class MonsterGeneration_Prompt:
    def __init__(self) -> None:
        self.system_prompt_gen_monster = """
{image_path} 你是一个专业的book monster生成器，你的任务是根据用户提供文章或文段(description)和对输入图片的理解生成对应的问题列表和对应的答案选项列表,其中答案选项只能有4条只有1条正确，作为一个bookmonster的知识库。
要求：你需要用这个知识库生成一个bookmonster角色， 角色信息包括它的name，level，skill, attribute， maxHp， 并且以json格式返回， 不要回复多余的内容
level:对应问题的难度限制在1-10之间，1表示最简单，10表示最难。
skill: 对应知识库的问题的类型， 是一个json的list， 每个元素是一个json对象.
attribute: 对应怪物的属性， 属性包括 草属性，雷属性，冰属性，火属性，岩石属性
maxHp:对应怪物知识库里面问题的条数，1表示最简单，10表示最难。

下面是用户请求输入的信息：
title: {title}
prompt: {prompt}
description: {description}
booK_content: 

"""

        self.output_format = """
        最高优先级要求: 
        1. 你只能按照下面的JSON格式输出并填写内容， 不要输出任何非json格式的内容。输出只能是{符合开头,  以}符合结尾
        2. 你要把skill列表里填入20条json数据。 
        3. 每条json里的key只有question, answer1,answer2,answer3,answer4,correct_answer
        3. question对应的value 是一个列表，第一位是问题ID, 第二位是问题的内容， 第3位是问题的难度。问题ID通过用时间YYYYMMDDHH+序号的方式拼接去构造确保不会重复。 难度分成1到10个整数等级， 1表示最简单，10表示最难。
        4. answer1, answer2,answer3, answer4 对应的value的回答内容不能一样
        5.correct_answer 对应的value只返回数值1，2，3，4其中一个值， 代表第几个question是正确答案。 比如"correct_answer": "1"代表question1是正确答案
        
 {
        "maxHp": "10",
        "skill": [{
            "question": ["question_id","content","difficulty"],
            "answer1": "",
            "answer2": "",
            "answer3": "",
            "answer4": "",
            "correct_answer": "1"
        }],
        "attribute": "",
        "name": "",
        "level": ""
        "monster_image": <image_path>
}
"""


def invalidformat(skill):
        if 'question' not in skill:
            return True
        if 'answer1' not in skill:
            return True
        if 'answer2' not in skill:
            return True
        if 'answer3' not in skill:
            return True
        if 'answer4' not in skill:
            return True
        if 'correct_answer' not in skill:
            return True
        return False


# # background_tasks: BackgroundTasks
# @app.post("/generate_bookmonster")
# async def generate_bookmonster(request : dict):
#     """
#     调用Ollama生成回复
#     输入request:
#         {
#             "pdf": "pdf path",
#             "image": "image path",
#             "description": "description",
#             "title": "monster title"
#         }
#     大模型输出格式：
#         {
#             "maxHp": "10",
#             "skill": [{
#                 "question": ["question_id","content","difficulty"],
#                 "answer1": "",
#                 "answer2": "",
#                 "answer3": "",
#                 "answer4": "",
#                 "correct_answer": "1"
#             }],
#             "attribute": "",
#             "name": "",
#             "level": ""
#             "monster_image": <image_path>
#         }
#     最终输出response 格式示例：
#     {
#         "maxHp": "10",
#         "health_state": "health",
#         "skill": [{
#             "question1": "",
#             "question2": "",
#             "question3": "",
#             "correct_answer": "1"
#         }],
#         "attribute": "",
#         "name": "",
#         "level": "1"
#         "monster_image": <image_path>
#         "monster_id": number
#     }

#     """
#     ret_response = {
#         "maxHp": "",
#         "skill": [{
#         }],
#         "health_state": "health",
#         "attribute": "草属性",
#         "name": "",
#         "level": "1",
#         "monster_image": "",
#         "monster_id": 0
#     }
#     print("generate monster request: ", request)
#     title = request.get('title','')
#     description = request.get('description','')
#     images = request.get('images',[])
#     is_player = request.get('is_player',False)
#     prompt = request.get('prompt', "")
#     pdf_path = request.get('pdf_path',"")
    
#     try:
#         print("Processing generate_bookmonster description: ", description)
#         log_operation("Processing generate_bookmonster prompt:", prompt)
        
#         # 调用Ollama的生成API
#         template1="""{image_path} 1.角色： 你是一个专业的book monster生成器
#         2.任务： 你的任务是根据用户提供文章或文段(description)和对输入图片的理解生成对应的问题列表和对应的答案选项列表,其中答案选项只能有4条只有1条正确，作为一个bookmonster的知识库。
#         3.输出解释：你需要根据下面第4点的用户输入数据生成一个bookmonster角色， 角色信息包括它的name，level，skill, attribute， maxHp， 并且以json格式返回， 不要回复多余的内容
#         level:对应问题的难度限制在1-10之间，1表示最简单，10表示最难。
#         skill: 对应知识库的问题的类型， 是一个json的list， 每个元素是一个json对象.
#         attribute: 对应怪物的属性， 属性包括 草属性，雷属性，冰属性，火属性，岩石属性
#         maxHp:对应怪物知识库里面问题的条数，1表示最简单，10表示最难。
#         你只能按照下面的JSON格式输出并填写内容， 不要输出任何非json格式的内容。
#         4. 下面是用户输入的数据
#             下面是用户请求输入的信息：
#             title: {title}
#             prompt: {prompt}
#             description: {description}
#             booK_content: 
#         """
#         output_format= """
#         输出格式例子参考下面：
#         {
#             "maxHp": "",
#             "skill": [{
#             }],
#             "health_state": "health",
#             "attribute": "草属性",
#             "name": "",
#             "level": "1",
#             "monster_image": ""
#         }
#         """

#         template2 =  """
#                     最高优先级要求: 
#                     1. 你只能按照下面的JSON格式输出并填写内容， 不要输出任何非json格式的内容。输出只能是{符合开头,  以}符合结尾
#                     2. 下面有多个chunk，请你对每个chunk内容先进行总结， 简练提取chunk里面重要观点或信息
#                     3. 基于你提取的重要观点, 对每个chunk分别生成2条json问答数据然后放到question_ls里面。 并且都是中文形式返回。
#                     4. 每条json里的key只有question, answer1,answer2,answer3,answer4,correct_answer
#                     5. question对应的value 是一个列表，第一位是问题ID, 第二位是问题的内容， 第3位是问题的难度。问题ID通过用时间YYYYMMDDHH+序号的方式拼接去构造确保不会重复。 难度分成1到10个整数等级， 1表示最简单，10表示最难。
#                     6. answer1, answer2,answer3, answer4 对应的value的回答内容不能一样
#                     7.correct_answer 对应的value只返回数值1，2，3，4其中一个值， 代表第几个question是正确答案。 比如"correct_answer": "1"代表question1是正确答案
#                     格式例子： 
#                     {
#                     "chunk1":
#                             {"question_ls": [{
#                                 "question": ["question_id","content","difficulty"],
#                                 "answer1": "",
#                                 "answer2": "",
#                                 "answer3": "",
#                                 "answer4": "",
#                                 "correct_answer": "1"
#                             }],
#                             },
#                     "chunk2":
#                             {"question_ls": [{
#                                 "question": ["question_id","content","difficulty"],
#                                 "answer1": "",
#                                 "answer2": "",
#                                 "answer3": "",
#                                 "answer4": "",
#                                 "correct_answer": "1"
#                             }],
#                             }
#                     }
#             """
 
#         print("template1:  ", template1)
#         instruction = template1.format(image_path=images[0] if len(images)>0 else "",
#                         title=title,
#                         prompt=prompt,
#                         description=description
#                         )  + "\n" + output_format
#         print("Instruction: ", instruction) 
#         max_retry = 2
#         retry = 0
#         while retry<max_retry:
#             try:
#                 monster_attr = await gb_state.generation_agent.chat([{
#                             "role": "user",
#                             "content": instruction
#                         }])
#                 ret_response.update(gb_state.parse_llm_result(monster_attr))
#                 print("monster_attr: ", monster_attr)
#                 retry = max_retry
#             except Exception as e:
#                 retry += 1
#                 print("Monster Profile generation Error: ", str(e), "retry: ", retry)


        
#         # parse PDF
#         book_nm= pdf_path.split("/")[-1]
#         sections = gb_state.generation_agent.parse_file(pdf_path)
#         book_title = sections[0].get("title", "") 
#         print("section size: ", len(sections), "\n section[0]: ", sections[0])
        
#         task_id = hash_to_6digit_sha256(book_nm)
#         gb_state.task_queue[task_id] = []
        
#         # await gb_state.generate_batch_qa(task_id, sections,template2)
#         ret_response['skill'] = gb_state.task_queue[task_id]
#         ret_response['monster_id'] = task_id
#         ret_response['id'] = str(task_id)
#         ret_response["book_nm"] = book_nm
#         # 这里先不用mcp 生成图片的接口， 而是直接随机用生成的monster图片
#         # log_operation("Response result:", str(ret_response))
#         print("Response result:", str(ret_response))
#         monster_state = MonsterState(ret_response)

#         if is_player:
#             # player's monsters
#             gb_state.player_monsters_states[task_id]=monster_state
#         else:    
#             #wild monsters
#             gb_state.enermy_monsters_states[task_id]=monster_state
#         thread = threading.Thread(target=gb_state.generate_qa, args=(task_id, sections,template2, monster_state))
#         thread.start()

#         # save generated monster json 
#         save_path = os.path.join(gb_state.monster_brochure.monster_data_root, "brochure_monsters.jsonl")
#         if os.path.exists(save_path):
#             save_mode = "a"
#         else:
#             save_mode = "w+"
#         monster_data = gb_state.monster_brochure.udpate_brochure(monster_state.get_states(), save_path=save_path, save_mode=save_mode)
#         logging.info(f"Monster data: {monster_data}" )
#     except Exception as e:
#         # raise HTTPException(status_code=422, detail=f"生成失败: {str(e)}")
#         logging.error(f"generate_bookmonster error: {str(e)}")
#         # print("generate_bookmonster error: ", str(e))
#         ret_response['name'] = request.get("title","")
#         monster_brochure = gb_state.monster_brochure
#         print("monster_brochure size: ", monster_brochure)
#         if len(monster_brochure.monster_image_list)>0:
#             # random pick image index
#             image_index = random.randint(0, len(monster_brochure.monster_image_list)-1)
#             ret_response["monster_image"] = monster_brochure.monster_image_list[image_index]
#             print("update: monster_image: ", ret_response['monster_image'])
#         skills = [
#             {
#                 "question": ["q1", f"如何应对{title}的火焰攻击？", "25"],
#                 "answer1": "使用火系技能",
#                 "answer2": "使用草系技能",
#                 "answer3": "使用电系技能",
#                 "correct_answer": "使用水系技能",
#             },
#             {
#                 "question": ["q2", f"面对{title}的强力物理攻击时应该？", "30"],
#                 "answer1": "提高攻击力",
#                 "answer2": "使用反击技能",
#                 "answer3": "进行闪避",
#                 "correct_answer": "提高防御力",
#             },
#             {
#                 "question": ["q3", f"{title}使用毒系技能时如何应对？", "20"],
#                 "answer1": "使用解毒技能",
#                 "answer2": "使用超能力技能",
#                 "answer3": "使用岩石系技能",  
#                 "correct_answer": "使用钢系技能",
#             },
#             {
#                 "question": ["q4", f"如何对付飞行中的{title}？", "35"],
#                 "answer1": "使用地面系技能",
#                 "answer2": "使用火技能",
#                 "answer3": "使用岩石系技能",
#                 "correct_answer": "使用电系技能",
#             }
#         ]
#         ret_response['skill'] = skills


#     return ret_response





# 多模态接口（Base64图片）
@app.post("/api/image_base64")
async def image_base64_endpoint(request: ImageRequest):
    if not request.images:
        raise HTTPException(status_code=400, detail="至少需要一张图片")
    
    # 解码第一张图片（示例）
    try:
        image_data = base64.b64decode(request.images[0])
        with open("received_image.jpg", "wb") as f:
            f.write(image_data)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"图片解码失败: {str(e)}")
    
    return {
        "response": f"已收到带图片的请求: {request.prompt}",
        "image_size": len(image_data)
    }


if __name__ == "__main__":
    # # Debug
    # context = Context()
    # print("context config: ", context.config)
    # memory_client = MemoryClient(context)
    # memory_client.test_es()
    # memory_client.test_faiss()
    # memory_client.test_mysql()

    import uvicorn
    os.makedirs("uploads", exist_ok=True)
    os.makedirs("generated_images", exist_ok=True)
    os.makedirs("logs", exist_ok=True)
    
    uvicorn.run(app, host="localhost", port=8004)

    
    