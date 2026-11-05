FROM gcc:13-bookworm
RUN useradd -m -u 1000 sandboxuser
WORKDIR /sandbox
USER sandboxuser
CMD ["bash"]
