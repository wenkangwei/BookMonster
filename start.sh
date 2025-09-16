#!/bin/bash
cd front-end
npm config set registry https://registry.npmmirror.com  # 淘宝源（国内推荐）



start(){
    cd AI-BookMon && \
    npm run dev
}

rebuild(){
    # 对其v0.dev build的方法
    cd AI-BookMon && \
    rm -rf .next node_modules && \
    corepack enable && \
    pnpm install --frozen-lockfile && \
    pnpm run build
    npm run dev
}


npm_rebuild(){
    # 这里build可能版本有问题， 建议用rebuild
    npm cache clean --force
    npm install --legacy-peer-deps
    npm run dev

    rm -rf .next node_modules package-lock.json

    # 重新安装
    npm install

    # 启动纯净环境测试
    npm run dev -- --no-cache


    # git clone git@github.com:wenkangwei/AI-BookMon.git
    # cd AI-BookMon
    # corepack enable
    # pnpm install
    # pnpm install --frozen-lockfile
    # pnpm run build
    # npx next build
    # npm run dev
}

if [ "$1" == "start" ]; then
  start

elif [ "$1" == "rebuild" ]; then
  rebuild

elif [ "$1" == "npm_rebuild" ]; then
  npm_rebuild
fi



