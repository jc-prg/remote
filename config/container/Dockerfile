FROM python:3

WORKDIR /usr/src/app

COPY ./requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD [ "python", "./server/server.py" ]
