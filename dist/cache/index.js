"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redisPswrd = "VrlLlMBU6zQmg1RPTOM0GMoO5dTSMgS3";
const redisUser = "default";
const ioredis_1 = require("ioredis");
// const client = createClient({
//   url: `redis://default:${redisPswrd}@redis-14248.c322.us-east-1-2.ec2.cloud.redislabs.com:14248`,
// }).on("error", (err) => console.log("Redis Client Error", err));
const redis = new ioredis_1.Redis({
    port: 14248,
    host: "redis-14248.c322.us-east-1-2.ec2.cloud.redislabs.com",
    username: "default",
    password: redisPswrd,
}).on("error", (err) => {
    console.log("ioRedis Error", err);
});
// redis.config('SET',)
exports.default = redis;
