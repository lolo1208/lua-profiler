# Lua Profiler

本程序用于统计和展现 Lua 代码耗时以及调用次数。

数据收集可参考:

   - Unity [C#](https://github.com/lolo1208/unity3d-lolo/tree/master/Assets/Framework/ShibaInu/Utils/Profiling) 以及 [Lua](https://github.com/lolo1208/unity3d-lolo/blob/master/Assets/Framework/ShibaInu/Lua/Utils/Optimize/Profiler.lua)


## To Use

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
git clone https://github.com/lolo1208/lua-profiler

# Go into the repository
cd lua-profiler

# Install dependencies
npm install

# Rebuild native modules
npm run rebuild

# Run the app
npm start


# Release the app
npm run pack
```


## 可能会遇到的问题

以下问题均由网络环境造成，最好的解决方案就是“科学上网”。

以 Windows x64 为例：

#### * 下载 electron 模块速度过慢或连接超时。
添加镜像地址到环境变量：
```
ELECTRON_MIRROR = https://npm.taobao.org/mirrors/electron/
```

#### * 运行 rebuild 时报错
iojs.lib : fatal error LNK1106.

可能是由于 iojs.lib 文件没下载完整造成的。

手动下载 [iojs.lib](https://gh-contractor-zcbenz.s3.amazonaws.com/atom-shell/dist/v2.0.11/win-x64/iojs.lib) 放到 C:/Users/[用户名]/.electron-gyp/.node-gyp/iojs-2.0.11/x64/ 目录中

