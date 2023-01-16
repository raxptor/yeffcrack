#include <memory.h>
#include "all.h"

void permutation_reset(char* p, int len, char base)
{
	for (int i = 0; i < len; i++)
		p[i] = base + i;
}

void permutation_walk(char* perm, MTRand* rand, int len)
{
	int whatToDo = genRandLong(rand) & 0xff;
	if (whatToDo < 10) {
		// mirror
		char tmp[128];
		memcpy(tmp, perm, len);
		for (int i = 0; i < len; i++) {
			perm[i] = tmp[len - 1 - i];
		}
	}
	else if (whatToDo < 50 && len > 4) {
		// pivot swap
		// 012 3456
		int pivot = 1 + genRandLong(rand) % (len - 2);
		char tmp[128];
		memcpy(tmp, perm, len);
		int outp = 0;
		for (int i = 0; i < (len - pivot); i++) {
			perm[outp++] = tmp[pivot + i];
		}
		for (int i = 0; i < pivot; i++) {
			perm[outp++] = tmp[i];
		}
	}
	else if (whatToDo < 100) {
		// rotate left
		char t = perm[0];
		for (int i = 0; i < len - 1; i++)
			perm[i] = perm[i + 1];
		perm[len - 1] = t;
	}
	else {
		// swap 2
		int a, b;
		do {
			a = genRandLong(rand) & 63;
			b = genRandLong(rand) & 63;
		} while (a == b || a >= len || b >= len);
		char t = perm[a];
		perm[a] = perm[b];
		perm[b] = t;
	}
}
