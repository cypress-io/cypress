FROM skysider/glibc_builder64:2.19
ENV PATH="/glibc/2.19/64/bin:$PATH"
ENV LD_LIBRARY_PATH="/glibc/2.19/64/lib:$LD_LIBRARY_PATH"