import re
from fastapi import FastAPI, UploadFile, File, HTTPException
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



tmp_data={"maxHp":"10","skill":[{"question":["202304010001","pikaqiu的属性是什么？",1],"answer1":"雷属性","answer2":"高铁属性","answer3":"水属性","correct_answer":"雷属性"},{"question":["202304010002","pikaqiu喜欢看的书籍是什么？",2],"answer1":"钢铁就是力量","answer2":"钢铁是怎样炼成的","answer3":"钢铁的未来","correct_answer":"钢铁就是力量"},{"question":["202304010003","pikaqiu的主人叫什么名字？",3],"answer1":"小k","answer2":"小明","answer3":"小红","correct_answer":"小k"},{"question":["202304010004","pikaqiu的主人是做什么的？",4],"answer1":"算法工程师","answer2":"数据分析师","answer3":"产品经理","correct_answer":"算法工程师"},{"question":["202304010005","pikaqiu的主人喜欢看的书籍是什么？",5],"answer1":"钢铁就是力量","answer2":"钢铁是怎样炼成的","answer3":"钢铁的未来","correct_answer":"钢铁就是力量"},{"question":["202304010006","pikaqiu的主人的主人叫什么名字？",6],"answer1":"小k","answer2":"小明","answer3":"小红","correct_answer":"小k"},{"question":["202304010007","pikaqiu的主人的主人是做什么的？",7],"answer1":"算法工程师","answer2":"数据分析师","answer3":"产品经理","correct_answer":"算法工程师"},{"question":["202304010008","pikaqiu的主人的主人喜欢看的书籍是什么？",8],"answer1":"钢铁就是力量","answer2":"钢铁是怎样炼成的","answer3":"钢铁的未来","correct_answer":"钢铁就是力量"},{"question":["202304010009","pikaqiu的主人的主人的主人叫什么名字？",9],"answer1":"小k","answer2":"小明","answer3":"小红","correct_answer":"小k"},{"question":["202304010010","pikaqiu的主人的主人的主人是做什么的？",10],"answer1":"算法工程师","answer2":"数据分析师","answer3":"产品经理","correct_answer":"算法工程师"},{"question":["202304010011","pikaqiu的主人的主人的主人喜欢看的书籍是什么？",1],"answer1":"钢铁就是力量","answer2":"钢铁是怎样炼成的","answer3":"钢铁的未来","correct_answer":"钢铁就是力量"},{"question":["202304010012","pikaqiu的主人的主人的主人的主人叫什么名字？",2],"answer1":"小k","answer2":"小明","answer3":"小红","correct_answer":"小k"},{"question":["202304010013","pikaqiu的主人的主人的主人的主人是做什么的？",3],"answer1":"算法工程师","answer2":"数据分析师","answer3":"产品经理","correct_answer":"算法工程师"},{"question":["202304010014","pikaqiu的主人的主人的主人的主人喜欢看的书籍是什么？",4],"answer1":"钢铁就是力量","answer2":"钢铁是怎样炼成的","answer3":"钢铁的未来","correct_answer":"钢铁就是力量"},{"question":["202304010015","pikaqiu的主人的主人的主人的主人的主人叫什么名字？",5],"answer1":"小k","answer2":"小明","answer3":"小红","correct_answer":"小k"},{"question":["202304010016","pikaqiu的主人的主人的主人的主人的主人是做什么的？",6],"answer1":"算法工程师","answer2":"数据分析师","answer3":"产品经理","correct_answer":"算法工程师"},{"question":["202304010017","pikaqiu的主人的主人的主人的主人的主人喜欢看的书籍是什么？",7],"answer1":"钢铁就是力量","answer2":"钢铁是怎样炼成的","answer3":"钢铁的未来","correct_answer":"钢铁就是力量"},{"question":["202304010018","pikaqiu的主人的主人的主人的主人的主人的主人叫什么名字？",8],"answer1":"小k","answer2":"小明","answer3":"小红","correct_answer":"小k"},{"question":["202304010019","pikaqiu的主人的主人的主人的主人的主人的主人是做什么的？",9],"answer1":"算法工程师","answer2":"数据分析师","answer3":"产品经理","correct_answer":"算法工程师"},{"question":["202304010020","pikaqiu的主人的主人的主人的主人的主人的主人喜欢看的书籍是什么？",10],"answer1":"钢铁就是力量","answer2":"钢铁是怎样炼成的","answer3":"钢铁的未来","correct_answer":"钢铁就是力量"}],"health_state":"health","attribute":"雷属性","name":"pikaqiu","level":"5","monster_image":"/character_images/placeholder-logo.png"}
# 初始化FastAPI
app = FastAPI(title=" BookMonster Agent API")

# 允许React前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

# Ollama配置
OLLAMA_BASE_URL = get_ollama_host()
OLLAMA_MODEL = get_model_name()

OLLAMA_CHAT_MODEL = get_chat_model_name()
print("OLLAMA_BASE_URL: ",OLLAMA_BASE_URL)
print("OLLAMA_MODEL: ",OLLAMA_MODEL)
print("OLLAMA_CHAT_MODEL: ",OLLAMA_CHAT_MODEL)

class MonsterBrochure():
    def __init__(self,) -> None:
        pwd = os.getcwd()
        root = "/".join(pwd.split("/")[:-1])
        # self.image_root = os.path.join(root , "data/character/images")
        self.image_root = os.path.join(root , "front-end/AI-BookMon/public/character_images/")
        self.monster_image_list = []
        for file in os.listdir(self.image_root):
            if file.endswith(".png"):
                self.monster_image_list.append( os.path.join("/character_images/", file))
        print("self.monster_image_list: ",self.monster_image_list)

class MonsterState():
    def __init__(self, json_config) -> None:
        self.name = json_config["name"]
        self.health_state = json_config.get("health_state","health")
        self.action_list =json_config["skill"]
        self.maxHp = json_config["maxHp"]
        self.currentHp = json_config["maxHp"]
        self.question_list = json_config["skill"]
        self.answer_list = json_config["skill"]
        self.attribute= json_config["attribute"]
        self.level = json_config["level"]
        self.monster_image_path = json_config["monster_image"]
        self.remain_question = { q["question"][0]: q for q in self.question_list}
    def update_currentHp(self, hp: int):
        self.currentHp = hp
    def set_maxHp(self, hp: int):
        self.maxHp = hp
    def get_states(self,):
        json_state = {
            "name": self.name,
            "health_state": self.health_state,
            "action_list": self.action_list,
            "maxHp": self.maxHp,
            "currentHp": self.currentHp,
            "attribute": self.attribute,
            "level": self.level,
        }
        return json_state
    def save_monster_config(self,root_path):
        json_config = {
            "name": self.name,
            "health_state": self.health_state,
            "action_list": self.action_list,
            "maxHp": self.maxHp,
            "currentHp": self.currentHp,
            "question_list": self.question_list,
            "answer_list": self.answer_list,
            "attribute": self.attribute,
            "level": self.level,
            "monster_image_path": self.monster_image_path,
        }
        with open(f"{root_path}/monster_config/{self.name}.json", "w") as f:
            json.dump(json_config, f)

class GlobalState():
    def __init__(self) -> None:
        super().__init__()
        self.monster_brochure = MonsterBrochure()
        self.player_monsters_states = []
        self.enermy_monsters_states = []
        # self.enermy_monsters_states.append(MonsterState(tmp_data))

gb_state = GlobalState()
# ----------------------
# 1. Ollama对话接口
# ----------------------
class EnermyState (BaseModel):
    monster_id: int
    # prompt: str
    model: str = OLLAMA_MODEL  # 允许前端指定模型
    current_hp: int = 0
    available_question_ids: List[str] = []
    health_state: str = "health"



class NextAction_Prompt:
    def __init__(self) -> None:
        self.system_prompt = """
你是一个热血神奇宝贝训练家，你的任务在对战中根据自己的神奇宝贝状态以及自己可以选择的动作，选择下一个动作。

下面是你的神奇宝贝状态：
State: {state}
下面是你对手的神奇宝贝的状态
State: {enermy_state}

你需要根据对手的状态和你自己的状态，从下面的question根据难度里面选择1个问题, 作为攻击手段。
如果对方回答对，那你的角色就会受伤，否则对方玩家的角色会受伤。 越难的问题，你的角色受到的伤害概率越大。
下面你可以选择的问题ID如下, 其中下面列表每一项的函数是 [问题ID, 问题内容, 问题难度]
question_id_list: {action}

另外你也可以和对手说话，通过激将法增加对方压力

"""
        self.format_prompt = """
        返回结果格式要求：
        1. 要返回和下面JSON结构一样的内容。 其中action=attack, tools=你选择的攻击问题的ID， reply=你回应对手的内容
{
    "action": "attack",
    "tools": "question_id",
    "reply": "我会攻击你"
}
"""


@app.post("/enemy_action")
async def enemy_action(request: EnermyState):
    """
    调用Ollama生成回复
    输入:
        {
            "monster_id": 0,
            "current_hp": 0,
            "available_question_ids": ["20230405009", "20230405010"],
            "health_state": "health"
        }
    输出:
        bookmonster json
    请求示例：
    {
        "action": "attack",
        "tools": question_id
    }

    return format:
        {
        "action": "attack",
        "tools": {
            "question_id": question_id,
            "question_difficulty": question_difficulty,
            "question": question,
            "answer1": answer1,
            "answer2": answer2,
            "answer3": answer3,
            "correct_answer": correct_answer,
        },
        "reply": "我会攻击你"
        }
    """
    ret_response = {
        "action": "attack",
        "tools": ""
    }
    print("request: ",request)
    try:
        async with httpx.AsyncClient() as client:
            next_action_prompt = NextAction_Prompt()
            # 调用Ollama的生成API
            monster_id= int(request.monster_id)
            print("monster_id: ", monster_id)
            print("len(gb_state.enermy_monsters_states): ", len(gb_state.enermy_monsters_states))
            if monster_id < len(gb_state.enermy_monsters_states):
                action_list = [ v['question'] for v in gb_state.enermy_monsters_states[monster_id].remain_question.values()]
                enemy_state = str(gb_state.enermy_monsters_states[0].get_states())
            else:
                action_list = []
                enemy_state = ""
            for question in gb_state.enermy_monsters_states[monster_id].remain_question:
                if question[0] in request.available_question_ids:
                    action_list.append(question)
        
            print("action_list: ", action_list)
            print(f"{OLLAMA_BASE_URL}/api/generate: ", OLLAMA_CHAT_MODEL)
            if len(gb_state.player_monsters_states) > 0:
                player_state = str(gb_state.player_monsters_states[0].get_states())
            else:   
                player_state = ""
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": OLLAMA_CHAT_MODEL,
                    "prompt": next_action_prompt.system_prompt.format(state=enemy_state
                                    , enermy_state=player_state
                                    , action=action_list) 
                                + "\n"+ next_action_prompt.format_prompt,
                    "stream": False  # 非流式响应
                },
                timeout=60.0
            )
            response.raise_for_status()
            result = response.json()
            print(OLLAMA_CHAT_MODEL +" Result: " + str(result['response']))
            if result.get("response", "No response") != "No response":
                resp = result.get("response")
                json_response = json.loads(resp.strip())
                question_id = json_response.get('tools', '').strip()
                tools = {}
                if question_id in gb_state.enermy_monsters_states[monster_id].remain_question:
                    # pop 出来的tools 的json格式是 {question:['','',''], answer1:"",answer2:"",answer3:"", correct_answer:""}
                    tools = gb_state.enermy_monsters_states[monster_id].remain_question.pop(question_id)
                    print("selected tools: ", tools)
                    question_info = tools.pop('question')
                    tools['question_id'] = question_info[0] if not question_info[0].startswith("questions_") else question_info[0][10:]
                    tools['question_difficulty'] = question_info[2]
                    tools['question'] = question_info[1]
                    
                    # correct_answer_k = tools['correct_answer']
                    # correct_answer = tools.pop("answer"+correct_answer_k)
                    # answer_list = []
                    # for k in tools:
                    #     if k.startswith("answer"):
                    #         answer_list.append(tools[k])
                    # for i in range(len(answer_list)):
                    #     tools["answer"+str(i+1)] = answer_list[i]
                    # tools["correct_answer"] = correct_answer
                ret_response =  {
                    'status': 'success',
                    'action': json_response.get('action', 'attack'),
                    'tools': tools
                }
        
        print("ret_response: ", ret_response)
        log_operation("Ollama对话", str(ret_response))
        return ret_response
    except httpx.HTTPStatusError as e:
        log_operation("enermy_action错误", f"HTTP错误: {e.response.text}", level="error")
        raise HTTPException(status_code=e.response.status_code, detail="Ollama服务错误")
    except Exception as e:
        log_operation("Ollama错误", str(e), level="error")
        raise HTTPException(status_code=500, detail=str(e))


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
description: {description}
prompt: {prompt}

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


@app.post("/generate_bookmonster")
async def generate_bookmonster(request : GenerateRequest):
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
        "maxHp": "10",
        "health_state": "health",
        "skill": [{
            "question1": "",
            "question2": "",
            "question3": "",
            "correct_answer": "1"
        }],
        "attribute": "",
        "name": "",
        "level": "1"
        "monster_image": <image_path>
    }
    """
    ret_response = {
        "maxHp": "",
        "skill": [{
        }],
        "health_state": "health",
        "attribute": "草属性",
        "name": "",
        "level": "1",
        "monster_image": ""
    }
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
    try:
        print("Processing generate_bookmonster request: ", request.description)
        log_operation("Processing generate_bookmonster request:", request.prompt)
        async with httpx.AsyncClient() as client:
            # 调用Ollama的生成API
            prompt_gen = MonsterGeneration_Prompt()
            instruction  = prompt_gen.system_prompt_gen_monster.format(image_path=request.images[0] if len(request.images)>0 else "",
                        title=request.title,
                        description=request.description,
                        prompt=request.prompt)  + "\n"+  prompt_gen.output_format
            print("Instruction: ", instruction)
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": OLLAMA_CHAT_MODEL,
                    "prompt": instruction,
                    "stream": False  # 非流式响应
                },
                timeout=600.0
            )
            response.raise_for_status()
            result = response.json()
            
            response_str = result.get('response')
            response_str = response_str.replace("```json\n", '').replace("```", '')
            paresed_result = json.loads(response_str)
            print(OLLAMA_MODEL +" Result: " + str(paresed_result))
            for k in ret_response:
                if k in paresed_result:
                    ret_response[k] = paresed_result[k]
                    if k == 'skill':
                        skill = ret_response[k]
                        filter_skill = []
                        for i in range(len(skill )):
                            # check if data is valid
                            if invalidformat(skill[i]):
                                continue
                            # print("skill: ", skill[i])
                            # post-process data
                            correct_answer_k = "answer"+ str(skill[i]['correct_answer'])
                            new_qa= {}
                            new_qa['question'] = skill[i]['question']
                            if new_qa['question'][0].startswith("question_"):
                                new_qa['question'][0] = new_qa['question'][0][9:]
                            correct_answer = skill[i][correct_answer_k]
                            new_answers = [v for k, v in skill[i].items() if k.startswith("answer") and k!=correct_answer_k]
                            
                            for j in range(len(new_answers)):
                                new_qa["answer"+str(j+1)] = new_answers[j]
                            new_qa['correct_answer'] = correct_answer
                            filter_skill.append(new_qa)
                        ret_response[k] = filter_skill
                    print( k+ ":",  ret_response[k])
            # 这里先不用mcp 生成图片的接口， 而是直接随机用生成的monster图片
            monster_brochure = gb_state.monster_brochure
            print("monster_brochure size: ", monster_brochure)
            if len(monster_brochure.monster_image_list)>0:
                # random pick image index
                image_index = random.randint(0, len(monster_brochure.monster_image_list)-1)
                ret_response["monster_image"] = monster_brochure.monster_image_list[image_index]
                print("update: monster_image: ", ret_response['monster_image'])
            # 
            print()
        
        log_operation("Response result:", str(ret_response))

        monster_state = MonsterState(ret_response)
        if request.is_player:
            # player's monsters
            gb_state.player_monsters_states.append(monster_state)
        else:    
            #wild monsters
            gb_state.enermy_monsters_states.append(monster_state)
    except Exception as e:
        
        # raise HTTPException(status_code=422, detail=f"生成失败: {str(e)}")
        print("generate_bookmonster error: ", str(e))
        ret_response['name'] = request.title
        monster_brochure = gb_state.monster_brochure
        print("monster_brochure size: ", monster_brochure)
        if len(monster_brochure.monster_image_list)>0:
            # random pick image index
            image_index = random.randint(0, len(monster_brochure.monster_image_list)-1)
            ret_response["monster_image"] = monster_brochure.monster_image_list[image_index]
            print("update: monster_image: ", ret_response['monster_image'])

        skills = [
            {
                "question": ["q1", f"如何应对{request.title}的火焰攻击？", "25"],
                "answer1": "使用火系技能",
                "answer2": "使用草系技能",
                "answer3": "使用电系技能",
                "correct_answer": "使用水系技能",
            },
            {
                "question": ["q2", f"面对{request.title}的强力物理攻击时应该？", "30"],
                "answer1": "提高攻击力",
                "answer2": "使用反击技能",
                "answer3": "进行闪避",
                "correct_answer": "提高防御力",
            },
            {
                "question": ["q3", f"{request.title}使用毒系技能时如何应对？", "20"],
                "answer1": "使用解毒技能",
                "answer2": "使用超能力技能",
                "answer3": "使用岩石系技能",  
                "correct_answer": "使用钢系技能",
            },
            {
                "question": ["q4", f"如何对付飞行中的{request.title}？", "35"],
                "answer1": "使用地面系技能",
                "answer2": "使用火技能",
                "answer3": "使用岩石系技能",
                "correct_answer": "使用电系技能",
            }
        ]
        ret_response['skill'] = skills
    return ret_response

# 辅助函数：获取图片尺寸
def get_image_dimensions(img_path):
    from PIL import Image
    with Image.open(img_path) as img:
        return {"width": img.width, "height": img.height}



# 纯文本接口
@app.post("/api/text")
async def text_endpoint(request: TextRequest):
    return {
        "response": f"已收到文本请求: {request.prompt}",
        "model": request.model
    }

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

# 多模态接口（文件上传）
@app.post("/api/image_upload")
async def image_upload_endpoint(
    prompt: str,
    model: str,
    file: UploadFile = File(...)
):
    # 保存上传的文件
    contents = await file.read()
    with open(file.filename, "wb") as f:
        f.write(contents)
    
    return {
        "response": f"已上传图片: {file.filename}",
        "prompt": prompt,
        "file_size": len(contents)
    }

# 调试接口（打印原始请求）
@app.post("/api/debug")
async def debug_endpoint(raw_request: dict):
    print("收到的原始请求:", raw_request)
    return {"debug_data": raw_request}

if __name__ == "__main__":
    import uvicorn
    os.makedirs("uploads", exist_ok=True)
    os.makedirs("generated_images", exist_ok=True)
    os.makedirs("logs", exist_ok=True)
    
    uvicorn.run(app, host="localhost", port=8000)