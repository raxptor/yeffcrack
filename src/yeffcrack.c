#define _CRT_SECURE_NO_WARNINGS
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <memory.h>
#include <io.h>
#include "all.h"

int scoring = 0;

int algo_score(void* ptr, t_score_fn fn, int print) {
	char tmp0[1024];
	char tmp1[1024];
	algo_run_data run;
	run.crack = ptr;
	run.tmp0 = tmp0;
	run.tmp1 = tmp1;
	algo_run(&run, print);
	return fn(run.output, run.length);
}

int user_chosen_scoring(const char* buf, int length)
{
	int diff;
	switch (scoring) {
		case 0: 
			return quadgram_score_buf(buf, length);
		case 1:
			diff = (compute_ic(buf, length) - ENGLISH_IC);
			return 1000000000 - diff * diff;
		default:
			printf("Invalid scoring!");
			exit(-1);
			break;
	}
}

int no_score(const char* buf, int length)
{
	return 0;
}

void call_analyze(char *name, const char*buf, const char*order)
{
	fprintf(stderr, "Analyze[%s] called with [%s] and [%s]\n", name, buf, order);
	if (!strcmp(name, "freq"))
		bulk_analyze_freq(buf);
	if (!strcmp(name, "subst"))
		bulk_analyze_subst(buf);
	if (!strcmp(name, "colsubst"))
		bulk_analyze_colsubst(buf, order);
	if (!strcmp(name, "playfair"))
		bulk_analyze_playfair(buf, order);
	if (!strcmp(name, "double"))
		bulk_analyze_double_polybius(buf, order);
	if (!strcmp(name, "frakcrack"))
		bulk_analyze_frakcrack(buf, order);
}

static void source_box(char *buf, const char *word, MTRand *rand)
{
	char used[256];
	memset(buf, 0x00, 26);
	memset(used, 0x00, 26);
	if (!word) word = word_get_random((genRandLong(rand) % 10) + 4, rand);
	int p = 0;
	int len = strlen(word);
	for (int i = 0; i < 40 && i < len; i++) {
		char c = word[i];
		if (!used[c - 'A'] && c != 'J') {
			buf[p++] = c;
			used[c - 'A'] = 1;
		}
	}
	const char* def = "ABCDEFGHIKLMNOPQRSTUVWXYZ";
	for (unsigned int i = 0; i < strlen(def); i++) {
		char c = def[i] - 'A';
		if (!used[c]) {
			buf[p++] = c + 'A';
			used[c] = 1;
		}
	}
	buf[25] = 0;
	// printf("word box is %s [%s]\n", buf, word);
}

int main(int argc, char *argv[])
{
	trigram_init();
	quadgram_init();
	words_init();
	MTRand rnd = seedRand(0x8fe2d2c0);

	//////////////////////////////
	for (int i = 0; i < argc; i++) {
		if (i < (argc - 1)) {
			if (!strcmp(argv[i], "--scoring")) {
				if (!strcmp(argv[i + 1], "ic")) {
					scoring = 1;
				} else {
					fprintf(stderr, "Invalid scoring mode.\n");
					exit(1);
				}
			} else if (!strcmp(argv[i], "--stdin-analyze")) {
				size_t bufsize = 1024 * 1024 * 12;
				char *buf = malloc(bufsize);
				int pos = 0;
				while (1) {
					int r = fread(&buf[pos], 1, bufsize - pos, stdin);
					if (r <= 0) break;
					pos += r;
				}
				buf[pos] = 0;
				const char* delim = "\n\r";
				char *token = strtok(buf, delim);
				printf("{\n");
				int first = 1;
				while (token) {
					if (!first) printf(", ");

					char tmp[4096];
					strcpy(tmp, token);
					int l = strlen(tmp);
					char* _ck = token;
					char* _order = "";
					for (int k = 0; k < l; k++) {
						if (tmp[k] == '|') {
							tmp[k] = 0;
							_ck = tmp;
							_order = &tmp[k + 1];
							break;
						}
					}

					call_analyze(argv[i + 1], _ck, _order);
					token = strtok(0, delim);
					first = 0;
				}
				printf("}\n");
				return 0;
			} if (!strcmp(argv[i], "--debug-analyze")) {
				call_analyze(argv[i + 1], 
					//"UXFRVNRABEDUFLFWGCFECUFRACDNKIDWDCDMGACQNFXXENBFCLDUNRFBEPLDUXREDHKDCEUEBDCNFACMFRFLSRDNDFQFSBBFUDRIBKFDNUFCEXBXRFCQEDFMDACQNFHDUPGPBFURMVQCONESREDRWDGSUDBCPPGDFPKQKGBPDOCRAFDVQBXRCKFKPODCPYFRQOBN",
					//"1252333544142311114212243431412141114214441344244231442413134354211111321112241215314124245242124522534112312222521334115412421332453541221213521231522441242233[UIQNEN[LGFSS[IOBSMI[EYTDD[FGQTAV[FTGAC[NGARVW[CC",
					"322112413341114351352444121451114131111244444311111221251333451232421242442214222222332422522353411422112331232114225332241424251344333124412323345452213143414411112451",
					 //"1442451243513214125411212243411213152113323514411243133534451445442114521114315134425413114422125244151211343153442132142551542133345114443252542342245454313222122521151423114531422514244145153454455411231111411231151324532351231322234254215214324111521442131441322215323212311531223534521545315113125534212211221413234125121233224125354121413511222123222553",
					//"5225121414145444424313114422453241545355533551315555422254325431514545455322232112143521433251333441114354545524225151412545515324412422411352444135411524335234222523522322223254521324223514545122",
					//33242551535221151442542131255415321215123425322215214322314113212345214232222221323511215353244434345234322222533331451224153235353311354513351114231314211351554132122442354221331145331355323323",
					//"5545555335224521524435435455412331242553224242332225425512114525424214454524125442222253213312111222143324234551123343252512313355251145541555252251431145214142434411533413544435554141254341143224",
					//"11152224333344425551111222333444555111222333",
					//"WHUAOTOFRSEMVIYTRTISOHMEETTCIRIEMHDEVIYTGWTWINSRHAAHFOOETWFLRBSEEESSIDSHIIEATFRGTMOHETOENTAEAARPPCTTETIAOHDSTWRTEOTWIMNSTIGANEHLREYOIURLBTNGHSOVPSEEKEYOILLRPYTENLDIAADKYLTMAIEEOWNDUDITLOLOKEHNXXKTAXXX",
					"ABBPHPALBEBQGMDRDCFOEPHEFCFPCODSGXBRAXAMFDBSCPDTDEFQEQHFBFFRGNDUACBTHQANBGBUGODVDFFSERHGFEFTCQDWGYBVAYAOFFBWCSDXDGFUESHHBHFVGPDYADBXHRAPBIBYGQEADHFWETHIFGFXCTEBHACABAAQFHCBCUECDIFYEUHJBJGAGREDAECCHSARBKCDGSEEDJGBEVHKFIGCCVEFHBCEBBASFJCFCWEGDKGDEWHLBLGEGTEHAFCGHTATBMCHGUEIDLGFEXHMFKGGCXEJHCCIBCAUFLCJCYEKDMGHEYHNBNGIGVELAKCKHUAVBOCLGWEMDNGJFAHOFMGKDAENHDCMBDAWFNCNDBEODQGLFB");
				return 0;
			}
		}
		if (!strcmp(argv[i], "--playfair")) {
			call_analyze("playfair", "HDNYAQQKUCEMLBBEGKDAAHNVMDKOXLWDEZTSECWGRXKDDAYPUZYLNVHMBHHIZLGYYDOFYDYQNVWDQZKANVMRYMENYWOUVMLUNVUQYWEAAIHDYQUZDAEMRGMRMEWGRXLZUYYBQROKRXLAGYYDQMDXEZQBQMWKEMYBPRBWORBYGIMEMRYLRTGDAQWBWKDXAHNVPRPT", 0);
			return 0;
		}
	}

	printf("Is fractionated: %d\n", algo_is_fractionated());
	{ // verification
		void* vf = malloc(algo_size());
		algo_initial_guess(vf, 1, &rnd);
		algo_score(vf, &no_score, 1);
	}

	printf("Scoring mode is %d\n", scoring);
	hillclimb();

	return 0;
}
