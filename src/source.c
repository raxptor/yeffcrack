#include "all.h"


void source_polybius(char *buf, MTRand *rand)
{
	char used[256];
	memset(buf, 0x00, 25);
	memset(used, 0x00, 25);
	const char *word = word_get_random(0, rand);
	int p = 0;
	for (unsigned int i = 0; i < strlen(word); i++) {
		char c = word[i];
		if (!used[c - 'A']) {
			buf[p++] = c;
			used[c - 'A'] = 1;
		}
	}
	const char* def = "ABCDEFGHIKLMNOPQRSTUVWXYZ";
	for (unsigned int i = 0; i < strlen(def); i++) {
		char c = def[i];
		if (!used[c - 'A']) {
			buf[p++] = c;
			used[c - 'A'] = 1;
		}
	}
}

void source_transposition(char *buf, int len, MTRand *rand)
{
	for (int i = 0; i < len; i++)
		buf[i] = i;
	for (int i = 0; i < len; i++) {
		int swap = (genRandLong(rand) & 0xff) % (len-i) + i;
		char t = buf[i];
		buf[i] = buf[swap];
		buf[swap] = t;
	}
}