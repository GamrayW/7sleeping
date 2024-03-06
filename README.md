# 7sleeping

## Installation

- Get [this](https://www.tampermonkey.net/) extension on your browser
- Once tampermonkey installed and loaded, click on the plugin icon and on "Create a new script..."
- Paste the userscript.js in the code block, Ctrl+S and close
- Launch quizzes and go to sleep

## Demo

Once a quizz started, a button *7sleeping* should appear, once clicked the bot will solve the questions

![](./demo.gif)


## Debug

If there's bugs, send me the javascript console output and the quizz url

## Known Bugs

- Sometimes the answer is "undefined". `answerOptions.answer[0].value = undefined` but `answerOptions.answer[0] = real answer`. Idk why and it happens very rarely so hard to replicate.

## Disclaimer

ban = not my fault
