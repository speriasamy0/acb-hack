import { Configuration, OpenAIApi } from "openai";
import { AuthInfo, Settings } from "./extension";
import createPrompt from './prompt';

import * as vscode from 'vscode';

export interface OpenAIService {
    search(prompt: string) : Promise<string>;
}

export class DefaultOpenAIService implements OpenAIService {
    
    private _openai?: OpenAIApi;
	private _currentMessageNumber = 0;

	private _settings: Settings = {
		selectedInsideCodeblock: false,
		pasteOnClick: true,
		maxTokens: 500,
		temperature: 0.5
	};
	private _apiConfiguration?: Configuration;
	private _apiKey?: string;
    
    constructor(){

    }
    search(prompt: string): Promise<string> {
        return new Promise(async (resolve,reject)=>{
            if (!prompt) {
                return;
            };
    
            // Check if the ChatGPTAPI instance is defined
            if (!this._openai) {
                this._newAPI();
            }
            
            let response = '';
            // Get the selected text of the active editor
            const selection = vscode.window.activeTextEditor?.selection;
            const selectedText = vscode.window.activeTextEditor?.document.getText(selection);
            let searchPrompt = createPrompt(prompt, this._settings, selectedText);
    
            if (!this._openai) {
                response = '[ERROR] API token not set, please go to extension settings to set it (read README.md for more info)';
            } else {
                // If successfully signed in
                console.log("sendMessage");
                
    
                // Increment the message number
                this._currentMessageNumber++;
    
                try {
                    let currentMessageNumber = this._currentMessageNumber;
    
                    // Send the search prompt to the OpenAI API and store the response
    
                    let completion;
                    if (this._settings.model !== 'ChatGPT') {
                        completion = await this._openai.createCompletion({
                            model: this._settings.model || 'code-davinci-002',
                            prompt: searchPrompt,
                            temperature: this._settings.temperature,
                            max_tokens: this._settings.maxTokens,
                            stop: ['\nUSER: ', '\nUSER', '\nASSISTANT']
                        });
                    } else {
                        completion = await this._openai.createCompletion({
                            model: 'text-chat-davinci-002-20221122',
                            prompt: searchPrompt,
                            temperature: this._settings.temperature,
                            max_tokens: this._settings.maxTokens,
                            stop: ['\n\n\n', '<|im_end|>']
                        });
                    }
    
                    if (this._currentMessageNumber !== currentMessageNumber) {
                        return;
                    }
    
                    response = completion.data.choices[0].text || '';
    
                    // close unclosed codeblocks
                    // Use a regular expression to find all occurrences of the substring in the string
                    const REGEX_CODEBLOCK = new RegExp('\`\`\`', 'g');
                    const matches = response.match(REGEX_CODEBLOCK);
                    // Return the number of occurrences of the substring in the response, check if even
                    const count = matches ? matches.length : 0;
                    if (count % 2 !== 0) {
                        //  append ``` to the end to make the last code block complete
                        response += '\n\`\`\`';
                    }
    
                    response += `\n\n---\n`;
                    // add error message if max_tokens reached
                    if (completion.data.choices[0].finish_reason === 'length') {
                        response += `\n[WARNING] The response was truncated because it reached the maximum number of tokens. You may want to increase the maxTokens setting.\n\n`;
                    }
                    response += `Tokens used: ${completion.data.usage?.total_tokens}`;
                    resolve(response);

                } catch (error:any) {
                    let e = '';
                    if (error.response) {
                        console.log(error.response.status);
                        console.log(error.response.data);
                        e = `${error.response.status} ${error.response.data.message}`;
                    } else {
                        console.log(error.message);
                        e = error.message;
                    }
                    response += `\n\n---\n[ERROR] ${e}`;
                    reject(response);
                }
            }
    
            // Saves the response
        });
        
    }

    	// Set the session token and create a new API instance based on this token
	public setAuthenticationInfo(authInfo: AuthInfo) {
		this._apiKey = authInfo.apiKey;
		this._apiConfiguration = new Configuration({apiKey: authInfo.apiKey});
		this._newAPI();
	}

	public setSettings(settings: Settings) {
		this._settings = {...this._settings, ...settings};
	}

	public getSettings() {
		return this._settings;
	}

	// This private method initializes a new ChatGPTAPI instance, using the session token if it is set
	private _newAPI() {
		if (!this._apiConfiguration || !this._apiKey) {
			console.warn("API key not set, please go to extension settings (read README.md for more info)");
		}else{
			this._openai = new OpenAIApi(this._apiConfiguration);
		}
	}

    public async resetSession() {
		this._newAPI();
	}
}