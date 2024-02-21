const redisPswrd = "VrlLlMBU6zQmg1RPTOM0GMoO5dTSMgS3";
const redisUser = "default";

import { Redis } from "ioredis";
import { createClient } from "redis";

// const client = createClient({
//   url: `redis://default:${redisPswrd}@redis-14248.c322.us-east-1-2.ec2.cloud.redislabs.com:14248`,
// }).on("error", (err) => console.log("Redis Client Error", err));

const redis = new Redis({
  port: 14248, // Redis port
  host: "redis-14248.c322.us-east-1-2.ec2.cloud.redislabs.com", // Redis host
  username: "default", // needs Redis >= 6
  password: redisPswrd,
}).on("error", (err) => {
  console.log("ioRedis Error");
});

export default redis;
