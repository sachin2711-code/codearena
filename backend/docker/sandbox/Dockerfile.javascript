FROM node:20-slim
RUN useradd -m -u 1000 sandboxuser
WORKDIR /sandbox
USER sandboxuser
CMD ["node"]
