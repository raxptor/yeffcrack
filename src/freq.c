const float en_freq[] = { 8.34f,1.54f,2.73f,4.14f,12.60f,2.03f,1.92f,6.11f,6.71f,0.23f,0.87f,4.24f,2.53f,6.80f,7.70f,1.66f,0.09f,5.68f,6.11f,9.37f,2.85f,1.06f,2.34f,0.20f,2.04f,0.06f };

int score_freq(const char* buf, int length)
{
	int counts[25];
	int tot = 0;
	for (int i = 0; i < 25; i++)
		counts[i] = 0;

	for (int i = 0; i < length; i++)
	{
		unsigned int w = buf[i] - 'A';
		if (w < 25) {
			counts[w]++;
			++tot;
		}
	}
	float sq = 0;
	for (int i = 0; i < 25; i++)
	{
		float freq = (float)counts[i] / (float)length;
		float diff = (freq - en_freq[i]);
		sq += diff*diff / en_freq[i];
	}
	return (int)-(100000.0f * sq);
}