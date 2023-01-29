#include <stdio.h>
#include <math.h>

struct QuadgramInput {
	const char *txt;
	int value;
};

typedef struct QuadgramInput QuadgramInput_t;

static const QuadgramInput_t RAWQUAD[] = {
// {"HEJE", 0}
	#include "quadgrams.inc"
};

int table[32 * 32 * 32 * 32];

int index_quadgram(const char *t)
{
	int a = t[0] - 'A';
	int b = t[1] - 'A';
	int c = t[2] - 'A';
	int d = t[3] - 'A';
	return a*32*32*32 + b*32*32 + c*32 + d;
}

int score_quadgram(const char *t)
{
	return table[index_quadgram(t)];
}

void quadgram_init()
{
	int count = sizeof(RAWQUAD) / sizeof(QuadgramInput_t);
	for (int i = 0; i < count; i++)
	{
		table[index_quadgram(RAWQUAD[i].txt)] = (int)(100000.0 * log(RAWQUAD[i].value));
	}
}

int quadgram_score_buf(const char *t, int length)
{
	if (length < 4)
		return 0;
	int tot = 0;
	for (int i = 0; i < length - 4; i++) {
		tot += score_quadgram(t + i);
	}
	return tot;
}

