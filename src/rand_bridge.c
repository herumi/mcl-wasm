// rand_bridge.c - compiled WITHOUT LTO to preserve cryptoGetRandomValues import
extern void cryptoGetRandomValues(void *buf, unsigned int byteSize);

static unsigned int randFunc(void *self, void *buf, unsigned int bufSize)
{
	(void)self;
	cryptoGetRandomValues(buf, bufSize);
	return bufSize;
}

// Defined in fp.o (LTO) via bn_c_impl.hpp
extern void mclBn_setRandFunc(void *self, unsigned int (*readFunc)(void *, void *, unsigned int));

__attribute__((visibility("default")))
void mclBn_initRandFunc(void)
{
	mclBn_setRandFunc(0, randFunc);
}
