FROM debian:11

RUN apt-get -y update
#RUN apt-get -y upgrade
RUN apt-get install -y python3-full
RUN apt-get install -y python3-pip
RUN apt-get install -y iputils-ping curl

WORKDIR /usr/src/app

# https://forge.rust-lang.org/infra/other-installation-methods.html
RUN curl https://sh.rustup.rs -sSf > install-rust2.sh
RUN /bin/sh install-rust2.sh -y --default-host arm-unknown-linux-gnueabihf
#--profile minimal
#--default-host armv7-unknown-linux-gnueabihf
ENV PATH="/root/.cargo/bin:${PATH}"
RUN ls /root/.cargo/bin
RUN echo ${PATH}

COPY ./requirements.txt ./requirements.txt

RUN apt-get install -y libffi-dev libssl-dev
#RUN python3 -m pip install --upgrade pip

#RUN rustc --version
#RUN python3 -m pip install --no-cache-dir -r requirements.txt
RUN pip3 install --no-cache-dir -r requirements.txt

RUN rustup self uninstall -y
RUN apt-get remove -y libffi-dev libssl-dev

COPY . .

CMD [ "python3", "./server/server.py" ]
