# 7sleeping

7sleeping is a quizz solver for the 7Speaking plateform. It exists because of design choices that leak answers to the client.

## Installation

- Get [this](https://www.tampermonkey.net/) extension on your browser
- Click [here](https://github.com/GamrayW/7sleeping/raw/main/7sleeping.user.js), tampermonkey should recognize the script and install it.
- Launch quizzes and go to sleep

## Demo

Once a quizz started, a button *7sleeping* should appear, once clicked the bot will solve the questions

![](./demo.gif)


## Debug

If there's bugs, please report them with the javascript console output and a description of the quizz. 

## Disclaimer

This was made solely for learning purposes, please refrain from using this bot for important exams.

Use this at your own risks, contributors can't be held accountable if your account gets banned or anything else while using 7sleeping.


## How to fix

7sleeping can retrieve the answers from the client because the application uses design that leaks answers, and stores the quizz result in the react bundle.

Take this example, a snippet of react code from an imaginary server:
```javascript
class SecretClass extends React.Component {
  constructor() {
    super();
    this.secret = "SecretPassword!";
  }

  render() {
    return <h2>No one can know my secret!</h2>;
  }
}
```

When the js bundle will be sent to the client, we will be able to retrieve the whole SecretClass object and its attributes.
```javascript
>> h2_tag.__reactFiber$1hbspvl3m9b.return.elementType.name
"SecretClass" 
>> h2_tag.__reactFiber$1hbspvl3m9b.return.stateNode['secret']
"SecretPassword!" 
```

As we can see, using `return`, we are able to go up the tree and retrieve the initial object SecretClass from the HTML h2 tag.


7sleeping uses a similar approach, retrieving `quizz_div.memoizedProps.return.[...].memoizedProps.answerOptions`, return is used to go up the object tree until finding the key 'answerOptions', which contain the correct answer.


