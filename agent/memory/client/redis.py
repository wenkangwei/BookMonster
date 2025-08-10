# from flask import Flask, request, jsonify
import redis
import json

class Reids_Client():
    def __init__(self, context):
        conf = context.config['memory']['redis']
        self.r = redis.Redis(host=conf.get('host', 'localhost'), port=conf.get('port', 6379))
        self.host = conf.get('host', 'localhost')
        self.port = conf.get('port', 6379)
    def set_key(self, key, value):
        self.r.set(key, value)
    def get_key(self, key):
        return self.r.get(key)
    def delete_key(self, key):
        self.r.delete(key)