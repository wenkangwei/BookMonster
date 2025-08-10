import os
import sys
import yaml


class Context:
    def __init__(self, config_path=""):
        current_path = os.path.abspath('.')  # 获取当前目录的绝对路径
        print(f"current_path: {current_path}")
        self.root_path ="/".join(current_path.split("/")[:-1])
        self.agent_root_path= os.path.join(self.root_path,"agent" )
        if config_path == "":
            config_path = os.path.join(self.root_path,"agent" ,"conf" ,"conf.yml")
        with open(config_path, 'r') as file:
            self.config = yaml.safe_load(file)
        self.config_path = config_path
        print(f"config_path: {self.config_path}")
        print(f"root_dir: {self.root_path}")
        print(f"agent_root_path: {self.agent_root_path}")
