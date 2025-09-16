# src/utils.py (部分)
import inspect
import json
def function_to_json(func) -> dict:
    # ... (函数实现细节)
    # 返回符合 OpenAI tool schema 的字典
    return {
        "type": "function",
        "function": {
            "name": func.__name__,
            "description": inspect.getdoc(func),
            "parameters": {
                "type": "object",
                "properties": parameters,
                "required": required,
            },
        },
    }



def get_current_weather(location, unit="celsius"):
    """
    {
        "type": "function",
        "function": {
            "name": "get_current_weather",
            "description": "模拟天气API调用",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "城市名称"
                    }
                },
                "required": ["location"]
            }
        }
    }
    """
    print(f"正在获取 {location} 的天气（单位: {unit}）")
    return json.dumps({
        "location": location,
        "temperature": "22",
        "unit": unit,
        "forecast": ["晴朗"]
    })

def send_email(recipient:str, subject:str, body:str) ->json:
    """{
        "type": "function",
        "function": {
            "name": "send_email",
            "description": "发送邮件",
            "parameters": {
                "type": "object",
                "properties": {
                    "recipient": {
                        "type": "string",
                        "description": "收件人邮箱"
                    },
                    "subject": {
                        "type": "string",
                        "description": "邮件主题"
                    },
                    "body": {
                        "type": "string",
                        "description": "邮件内容"
                    }
                },
                "required": ["recipient"]
            }
        }
}
    """
    print(f"发送邮件给 {recipient}，主题: {subject}")
    print(f"内容: {body}")
    return json.dumps({"status": "success", "message": "邮件已发送"})


def gen_tools_desc(funcs):
    from inspect import signature
    res = []
    for func in funcs:
        func_desc = func.__doc__
        # sig = signature(func)
        # print("func signature: ",sig)
        # print("Parameters:  ",sig.parameters['recipient'])
        # print("sig.parameters['recipient']: ", type(sig.parameters['recipient']))
        # print("Return annotation:  ",sig.return_annotation)
        # template = template.format(func.__name__, func.__doc__, sig.parameters['recipient'])
        print(func_desc)
        res.append(json.loads(func_desc))
    return res


# sig = signature(send_email)
# print("send_email signature: ",sig)
# print("Parameters:  ",sig.parameters)
# print("Return annotation:  ",sig.return_annotation)