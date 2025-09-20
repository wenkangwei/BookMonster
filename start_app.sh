#!/bin/bash

# start databases
cd docker
bash start_docker_services.sh start
cd -

# start backend
#cd agent/ && python app_v2.py &
bash start_back_end.sh start &

BACKEND_PID=$(jobs -p)
echo "Backend started with PID: $BACKEND_PID"
	

# start front-end
bash start_front_end.sh start

#BACKEND_PID=$(jobs -p)
#echo "Backend started with PID: $BACKEND_PID"

