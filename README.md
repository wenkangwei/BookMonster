# 待办
[x] 添加数据库功能存放对战日志， 创建的monster数据， 前端和后端对数据库进行交互

[x] 用MCP把多模态LLM接到 chat LLM工具调用里面

[ ] bookmonster 支持defend 和闪避功能

[x] 修复道具使用和bgm，精灵球功能

[x] test redis in docker

[x] pdf parser and save chunks to milvus

[x] test elasticsearch and bm25 in docker

[x] test MySql in docker


# 环境配置

## docker 环境
docker安装请参考我之前的文章： https://mp.weixin.qq.com/s/OMtb1DL_ik2TvENzWHWGsg


## 打包conda env 到docker镜像
如果有需要把conda 环境打包到docker镜像里面用，请参考下面， 否则直接跳过这部分内容
~~~
conda install -c conda-forge conda-pack
conda pack -n agent_env -o agent_env.tar.gz
~~~

构建自己docker环境的dockerfile
~~~
FROM debian:buster-slim

# 安装最小化依赖
RUN apt-get update && apt-get install -y \
    bzip2 \
    && rm -rf /var/lib/apt/lists/*

# 创建目标目录并解压环境
RUN mkdir -p /opt/env
COPY agent_env.tar.gz /opt/env/
RUN tar -xzf /opt/env/agent_env.tar.gz -C /opt/env \
    && rm /opt/env/agent_env.tar.gz

# 激活环境
ENV PATH /opt/env/bin:$PATH

# 验证
RUN which python
RUN python --version

# 设置工作目录
WORKDIR /app
COPY . /app

# 运行命令
CMD ["python", "agent.py"]
~~~


## python环境 安装
本项目的python环境使用python3.13.5版本

~~~shell
#cat all_requirements.txt | grep -E "torch|cuda|torchvision|torchaudio|pydantic|openai|fastapi|faiss|elastic|sql|milvus|redis|tiktoken|PyPDF2|markdown|bs4"
# 只要安装 requrirements.txt

# conda 安装
conda env create -n agent_env -f requirement.txt

#或者python 安装
pip install -r requirement.txt

~~~


# 运行
~~~shell
# 启动docker+前后端
cd docker/ && sh start_docker_services.sh start

#仅启动后端
sh start_backend.sh

#仅启动前端
sh start_front_end.sh

~~~


# 基础类角色对象
```
monster_state={
    monster_id:
    monster_name:
    monster_image: 本地monster图片保存路径
    attribute: 属性：草，火， 水...
    book_name: 每次上传的材料的书名或资料名称
    book_id: 用book_name hashing得到的id，
    level: 1,
    exp: 0,
    maxHp: 最大HP量
    currentHp: 当前HP量
    attack: 攻击力
    defense: 防御力
    speed: 速度
    skills: [
        {
            "question": ["question_id","content","difficulty"],                    "answer1": "",
            "answer2": "",
            "answer3": "",
            "answer4": "",
            "correct_answer": "1"
            },
        {
            "question": ["question_id","content","difficulty"],                    "answer1": "",
            "answer2": "",
            "answer3": "",
            "answer4": "",
            "correct_answer": "1"
        },
        
    ]
}
```

备注:  skills列表里面， 每个question 对应角色的攻击选项。 而question对应的4个answer对应玩家技能选项。玩家通过选择选项来回避还击对方。问题的难度对应攻击值， correct_answer 对应正确答案的序号



# 后端接口说明

1. 初始化用户选择角色
接口: ```/init_monster```
请求参数:  ```{}```
返回结果：  ```{monster： [monster_state_dict1, monster_state_dict2, monster_state_dict3... ]}```
解释: 游戏开始界面玩家选择角色时后端返回角色列表， 用户在前端选择并保留玩家角色。 其中monster_state_dict1， monster_state_dict2，monster_state_dict3 代表生成角色基础信息的词典对应上面monster_state的格式



2. 生成对方角色
接口: ```/generate_bookmonster```
请求参数: 
```
    {
            "pdf": "pdf path",
            "image": "image path",
            "description": "description",
            "title": "monster title",
            "is_player":
    }
```
返回结果：
```
{
    monster_id:
    monster_name:
    monster_image: 本地monster图片保存路径
    attribute: 属性：草/火/水/雷/钢/飞行/地面/超能力
    book_name: 每次上传的材料的书名或资料名称
    book_id: 用book_name hashing得到的id，
    level: 1,
    exp: 0,
    maxHp: 最大HP量
    currentHp: 当前HP量
    attack: 攻击力
    defense: 防御力
    speed: 速度
}
```
解释: 用户上传pdf， image， text后后端服务器生成对战角色， 返回对战角色信息字典。 但是不返回skills列表。 skills列表的问答内容存放在后端ES数据库。只有在调用 ```/enemy_action``` 对战接口时， 才会从数据库里返回指定的question 字典。

3. 角色对战
接口: ```/enemy_action```
请求参数:
```
        {
            "monster_id": 和玩家对战的角色id,
            "current_hp": 和玩家对战的角色当前hp,
            "health_state": 和玩家对战的角色当前状态,
            "player_monster_id": 玩家控制的角色id
            "player_hp": 玩家控制的角色当前hp
            "player_state": 玩家控制的角色状态,
            "player_win": False/True 玩家是否答对
        }
```
返回结果：
```
        {
            "question": ["question_id","content","difficulty"],
            "answer1": "",
            "answer2": "",
            "answer3": "",
            "answer4": "",
            "correct_answer": "1"
        }
```
返回大模型挑选的问题和答案作为下一轮对战的攻击和问题选项
解释: 前端在用户选取答案后判断用户是否答对问题， 答对问题敌方扣hp， 答错问题玩家扣hp， 之后把更新后的双方状态发送给```/enemy_action``` 接口， 大模型根据情况判断选择哪些难度的问题

