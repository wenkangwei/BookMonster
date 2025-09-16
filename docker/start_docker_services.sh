#!/bin/bash

## 如果有定义profile 就按照profile字段对所有有profile字段的service启动
# docker compose --profile "milvus" up -d
# sleep 10
# docker-compose ps
# docker-compose logs
start() {
  ## 只启动主入口的service 即 需要build 的dockersfile的启动方式
  # docker compose up -d
  ## 如果有定义profile 就按照profile字段对所有有profile字段的service启动
  docker compose --profile "*" up -d
  sleep 10
  echo "启动完成"
  docker-compose ps
  docker-compose logs
}

stop() {
  echo "stop所有容器"
  docker container stop $(docker ps -aq)
}


rm_containers() {
  stop
  echo "删除所有容器"
  docker container rm $(docker ps -aq)
}

rm_docker_images() {
  docker rmi $(docker images -q)
}

rm_docker_volumes() {
  docker volume rm $(docker volume ls -q)
}

# 根据shell脚本传入参数来选择函数执行
if [ "$1" == "start" ]; then
  rm_containers
  start
elif [ "$1" == "rm_containers" ]; then
  rm_containers
elif [ "$1" == "rm_images" ]; then
  rm_docker_images
elif [ "$1" == "rm_volumes" ]; then
  rm_docker_volumes
else
  echo "请输入正确的参数"
fi