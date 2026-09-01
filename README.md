# CodeWithFriends


### How to Run (Development)

frontend:
cd client
npm run dev

backend:
cd server
.\mvnw.cmd spring-boot:run

to test multiple tabs copy localhost url in multiple tabs:
http://localhost:5174/


# run redis locally

run this from root after starting docker desktop

docker start cwf-redis 
OR docker rm -f cwf-redis

docker run --name cwf-redis -p 6379:6379 -d redis

# wire up everything in docker

to run locally in docker (first start docker desktop) : 

docker compose up
