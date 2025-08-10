#!/bin/bash

## 只启动主入口的service 即 需要build 的dockersfile的启动方式
# docker compose up -d

## 如果有定义profile 就按照profile字段对所有有profile字段的service启动


# docker compose --profile "milvus" up -d
# sleep 10
# docker-compose ps
# docker-compose logs
start() {
  docker compose --profile "*" up -d
}

rm_docker_containers() {
  docker container rm $(docker ps -aq)
}

rm_docker_images() {
  docker rmi $(docker images -q)
}

rm_docker_volumes() {
  docker volume rm $(docker volume ls -q)
}