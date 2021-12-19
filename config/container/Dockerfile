FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /usr/src/app

RUN apt-get -y update 
RUN apt-get install -y python3 python3-distutils python3-pip python3-apt apt-utils
RUN apt-get install -y iputils-ping

COPY ./requirements.txt ./requirements.txt

RUN python3 -m pip install --upgrade pip
RUN python3 -m pip install -U setuptools
RUN python3 -m pip install -U wheel
RUN python3 -m pip install --no-cache-dir -r requirements.txt

COPY . .

CMD [ "python", "./server/server.py" ]
