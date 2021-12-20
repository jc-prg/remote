FROM python:3

WORKDIR /usr/src/app

RUN apt-get update
RUN apt-get install -y iputils-ping

COPY ./requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD [ "python", "./server/server.py" ]
