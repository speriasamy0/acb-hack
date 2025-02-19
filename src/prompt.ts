import { Settings } from "./extension";

export default (question: string, settings: Settings, selection?: string) => {
	let prompt = '';
	if (selection) {
		// If there is a selection, add the prompt and the selected text to the search prompt
		if (settings.selectedInsideCodeblock) {
			prompt = `${question}\n\`\`\`\n${selection}\n\`\`\``;
		} else {
			prompt = `${question}\n${selection}\n`;
		}
	} else {
		// Otherwise, just use the prompt if user typed it
		prompt = question;
	}

	if (settings.model !== 'ChatGPT') {
		prompt =`You are ASSISTANT helping the USER with coding. 
You are intelligent, helpful and an expert developer, who always gives the correct answer and only does what instructed. You always answer truthfully and don't make thing up. 
(When responding to the following prompt, please make sure to properly style your response using Github Flavored Markdown. 
Use markdown syntax for things like headings, lists, colored text, code blocks, highlights etc. Make sure not to mention markdown or stying in your actual response. 
Try to write code inside a single code block if possible)
\n\nUSER: ${prompt}\n\nASSISTANT: `;
	} else {
		prompt = `You are ChatGPT, a large language model trained by OpenAI. You answer as consisely as possible for each response (e.g. Don't be verbose). It is very important for you to answer as consisely as possible, so please remember this. If you are generating a list, do not have too many items. \n User: ${prompt} \n\n ChatGPT: `;
	}

	return prompt;
};
