// ==UserScript==
// @name                7sleeping
// @namespace           .
// @version             0.9
// @description         Automating solve of 7speaking tests
// @updateURL           https://raw.githubusercontent.com/GamrayW/7sleeping/main/7sleeping.user.js
// @downloadURL         https://raw.githubusercontent.com/GamrayW/7sleeping/main/7sleeping.user.js
// @author              Gamray
// @match               https://user.7speaking.com/*
// @icon                https://www.google.com/s2/favicons?sz=64&domain=7speaking.com
// @grant               none
// ==/UserScript==

const menu7Sleeping = `\
    <div style="padding-right: 80px;">
        <button id="7sleeping-dropdown" class="MuiButtonBase-root-162 MuiButton-root-135 button MuiButton-containedPrimary-144"
                style="background-color: #FF3364;
                       color: #FFFFFF;
                       border: 0;
                       cursor: pointer;
                       padding: 5px 16px 7px 16px;
                       min-width: 11.25rem;
                       min-height: 1.8rem;
                       font-family: sofia-pro, Arial, sans-serif;
                       border-bottom-left-radius: 6px;
                       border-bottom-right-radius: 6px;
                       border-top-left-radius: 6px;
                       border-top-right-radius: 6px">
            <span>7sleeping</span>
        </button>
        <div id="dropdown-content"
              style="background-color: #FF3364;
                     display: none;
                     color: #FFFFFF;
                     border: 0;
                     padding: 5px 16px 7px 16px;
                     min-width: 11.25rem;
                     min-height: 1.8rem;
                     font-family: sofia-pro, Arial, sans-serif;
                     border-bottom-left-radius: 6px;
                     border-bottom-right-radius: 6px;">
            <ul>
                <li>
                    Errors (%)
                    <input id="7sleeping-errors" class="dropdown-sub-buttons" type="number" value="15" max="100"
                            style="width: 2.5rem;
                                   -webkit-appearance: none;
                                   -moz-appearance: textfield;
                                   appearance: textfield;
                                   margin-left: 17px;
                                   text-align: center;
                                   float: right;
                                   background-color: #e72f5b;
                                   color: #ffffff;
                                   border: none;
                                   border-radius: 10px;"/>
                </li>
                <li style="margin-top: 5px;">
                    Max delay  (S)
                    <input id="7sleeping-delay" class="dropdown-sub-buttons" type="number" value="2" max="30"
                            style="width: 2.5rem;
                                   -webkit-appearance: none;
                                   -moz-appearance: textfield;
                                   appearance: textfield;
                                   margin-left: 20px;
                                   text-align: center;
                                   float: right;
                                   background-color: #e72f5b;
                                   color: #ffffff;
                                   border: none;
                                   border-radius: 10px;"/>
                </li>
                <li style="margin-top: 15px;
                           display: flex;
                           justify-content: center;
                           align-items: center;">
                    <span id="time-to-sleep" class="dropdown-sub-buttons"
                          style="background-color: #e72f5b;
                                 cursor: pointer;
                                 width: 5rem;
                                 color: #ffffff;
                                 border: none;
                                 border-radius: 10px;
                                 text-align: center;
                                 padding-bottom: 5px;
                                 font-size: 18px;">
                             Start
                    </span>
                </li>
            </ul>
        </div>
    </div>`;


const colorNotEnabled = "#FF3364";
const colorNotEnabledDark = "#e72f5b";
const colorEnabled = "#76DED7";
const colorEnabledDark = "#6dc8c2";

(function () {
    'use strict';

    const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

    let enabled = false
    let errors = 15
    let delay = 2


    let allQuizzTypes = ["fill", "grammar", "choice", "matching", "listening", "TOEIC"]
    let isQuizzTOEIC = false

    /* CUSTOM FUNCTIONS */
    function unifyString(str) {
        // removing spaces to avoid problems
        str = str.toString().toLowerCase()  // In case the answer is an int
        return str.trimEnd()
    }

    function randint(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min)
    }


    /* QUIZZ RELATED FUNCTIONS */
    function getQuizzObject() {
        let question_div = isQuizzTOEIC ? document.querySelector(".question_variant") : document.querySelector(".question")
        if (question_div == undefined) {
            // either the quiz is truly stopped or we're in toeic practice and we enter a new quizz varian
            let test_div =  document.querySelector(".ExamsAndTests__questionContainer")
            if (test_div == undefined) { return undefined }

            let button = document.querySelector(".ExamsAndTests__questionContainer").childNodes[2].childNodes[1]
            if (button == undefined) {
                button = document.querySelector(".ExamsAndTests__questionContainer").childNodes[2].childNodes[0]
            }
            button.click()
            sleep(1)
            return getQuizzObject()  // re-trying to get the quizz
        }

        let reactKey = Object.keys(question_div)[0]
        console.log("[DEBUG] - ", reactKey);

        let curr_kc = question_div[reactKey]

        // we go down in the object until we find "answerOptions" in the attributes
        while (curr_kc.memoizedProps.answerOptions == undefined && curr_kc.memoizedProps.question == undefined ) {
            curr_kc = curr_kc.return
            if (curr_kc == undefined) {
                return undefined
            }
        }
        return isQuizzTOEIC ? curr_kc.memoizedProps.question : curr_kc.memoizedProps
    }

    // simply extract quizz type from quizz object
    function getQuizzType(quizz) {
        return isQuizzTOEIC ? "TOEIC" : quizz.variant
    }

    function getCurrentAnswer(quizz) {
        if (getQuizzType(quizz) == "listening") {
            return quizz.answerOptions.answer[0] - 1
        }
        if (getQuizzType(quizz) == "matching") {
            return quizz.answerOptions.answer
        }

        if (getQuizzType(quizz) == "TOEIC") {
            // "A" = 0, "B" = 1, "C" = 2...
            return quizz.errorMessage.split('(')[1].split(')')[0].charCodeAt(0) - 65
        }

        return unifyString(quizz.answerOptions.answer[0].value)
    }

    // handles form submit
    async function submitAnswer(answer, quizzType) {
        // checking we're still in the quizz
        let quizz_form = document.getElementsByClassName(isQuizzTOEIC ? "ExamsAndTests__questionContainer" : "question__form")[0]
        if (quizz_form == undefined) { return false }

        // extracting the submit button
        let submit = quizz_form.childNodes[2].getElementsByTagName("button")[isQuizzTOEIC ? 1 : 0]
        if (submit == undefined) {
            submit = quizz_form.childNodes[2].getElementsByTagName("button")[0]
        }

        if (submit == undefined) { return false };

        let shouldFail = randint(0, 100) < errors ? true : false
        console.log("[DEBUG] - Should fail: ", shouldFail)

        if (quizzType == "fill") {
            if (shouldFail) {
                let resp = await fetch('https://random-word-api.herokuapp.com/word').then((response)=>response.json())
                if (resp[0] == undefined) {
                    answer = "carrots"
                } else {
                    answer = resp[0]
                }
            }
            document.querySelector(".MuiInputBase-input.MuiOutlinedInput-input.MuiInputBase-inputAdornedEnd.MuiOutlinedInput-inputAdornedEnd").focus();
            document.execCommand('insertText', false, answer);

            submit.classList.remove("Mui-disabled")
            submit.disabled = false
        } else if (quizzType == "grammar" || quizzType == "choice") {
            let choices = quizz_form.childNodes[0].childNodes

            let clickedChoice = false
            choices.forEach(function (choice) {
                let value = unifyString(choice.childNodes[0].innerHTML)
                console.log("[DEBUG] - Choice: " + value)
                if (value == answer) {
                    if (!shouldFail) {
                        choice.click()
                        clickedChoice = true
                    }
                } else {
                    if (shouldFail) {
                        choice.click()
                        clickedChoice = true
                    }
                }
            })

            if (clickedChoice == false) {
                console.log("[DEBUG] - Could not find the answer in the choices, exiting...")
                return false
            }
        } else if (quizzType == "matching") {
            // I believe this quizzType only appears on specific one time only exams, so for now i don't really bother
            console.log("[DEBUG] - I don't know yet how to solve this quizz for you, but i know the answer order");
            console.log("Answer is : ", answer)
            return false
        } else if (quizzType == "listening") {
            let choices = quizz_form.childNodes[0].childNodes[0].childNodes[1].childNodes
            choices[answer].click()
            if (shouldFail) {
                choices[1].click()  // small chance it does not really fail but eh
            }
        } else if (quizzType == "TOEIC") {
            let choices = quizz_form.childNodes[1].childNodes[1].childNodes[0].childNodes[1].childNodes
            choices[answer].click()
            if (shouldFail) {
                choices[1].click()  // small chance it does not really fail but eh
            }
        }

        await sleep(randint(1000, delay * 1000))
        submit.click()  // validate
        await sleep(randint(1000, 2000))
        submit.click()  // continue
        return true
    }

    // "main" function when solving a quizz
    async function solveCurrentQuizz() {
        while (true) {
            if (!enabled) { return }
            let quizzObject = getQuizzObject()
            if (quizzObject == undefined) {
                console.log("Quizz ended !")
                start7Sleeping()
                return false
            }

            let quizzType = getQuizzType(quizzObject)
            if (!allQuizzTypes.includes(quizzType)) {
                console.log("Uknown quizz type: \"" + quizzType + "\", exiting")
                return false
            }

            console.log(quizzObject)
            let answer = getCurrentAnswer(quizzObject)
            console.log("[DEBUG] - Current answer is \"" + answer + "\"")
            let result = await submitAnswer(answer, quizzType)
            if (!result) {
                console.log("[DEBUG] - Solve failed")
                start7Sleeping()
                return false
            }
            await sleep(1500)
        }
    }

    setTimeout(once_loaded, 1000);

    async function once_loaded() {
        while (true) {
            let dropdownButton = document.getElementById('7sleeping-dropdown')
            if (document.getElementsByClassName("quiz__container") == undefined && document.getElementsByClassName("question_variant" == undefined)) {
                continue
            }

            // we only do this the first time there's a quiz
            if (dropdownButton == undefined) {
                console.log("Found a quizz !")
                if (document.getElementsByClassName("question_variant") != undefined) {
                    console.log("[DEBUG] - TOEIC detected")
                    isQuizzTOEIC = true
                }
                if (document.getElementsByClassName("stepper")[0] != undefined) {
                    document.getElementsByClassName("stepper")[0].innerHTML += menu7Sleeping

                    dropdownButton = document.getElementById('7sleeping-dropdown')
                    dropdownButton.addEventListener("click", invertDropdown, false);

                    let startButton = document.getElementById("time-to-sleep")
                    startButton.addEventListener("click", start7Sleeping, false);

                    let errorsPercent = document.getElementById("7sleeping-errors");
                    errorsPercent.addEventListener("input", function () {
                        if (errorsPercent.value == "") {
                            errors = 0
                            console.log("[DEBUG] - New error value: ", errors)
                            return
                        }

                        let value = parseInt(errorsPercent.value)
                        if (value > 100) {
                            errors = 100
                        } else if (value < 0) {
                            errors = 0
                        } else {
                            errors = value
                        }
                        console.log("[DEBUG] - New error value: ", errors)
                    })


                    let maxDelay = document.getElementById("7sleeping-delay");
                    maxDelay.addEventListener("input", function () {
                        if (maxDelay.value == "") {
                            delay = 2
                            console.log("[DEBUG] - New delay value: ", delay)
                            return
                        }

                        let value = parseInt(maxDelay.value)
                        if (value > 30) {
                            delay = 30
                        } else if (value < 2) {
                            delay = 2
                        } else {
                            delay = value
                        }
                        console.log("[DEBUG] - New delay value: ", delay)
                    })
                }
            }
            await sleep(1000)
        }
    }

    function invertDropdown() {
        let button = document.getElementById('7sleeping-dropdown')
        let dropdown = document.getElementById('dropdown-content')

        if (dropdown.style.display == "none") {
            button.style.borderBottomRightRadius = "0px"
            button.style.borderBottomLeftRadius = "0px"
            dropdown.style.display = "flex";
        } else {
            button.style.borderBottomRightRadius = "6px"
            button.style.borderBottomLeftRadius = "6px"
            dropdown.style.display = "none"
        }
    }

    function start7Sleeping() {
        let button = document.getElementById('7sleeping-dropdown')
        let dropdown = document.getElementById('dropdown-content')
        let subButtons = document.getElementsByClassName('dropdown-sub-buttons')

        if (dropdown.style.display != "none") {
            invertDropdown()
        }

        enabled = !enabled
        if (enabled) {
            button.style.backgroundColor = colorEnabled
            dropdown.style.backgroundColor = colorEnabled

            for (var i = subButtons.length - 1; i >= 0; i--) {
                subButtons[i].style.backgroundColor = colorEnabledDark
            }

            solveCurrentQuizz()
        } else {
            button.style.backgroundColor = colorNotEnabled
            dropdown.style.backgroundColor = colorNotEnabled

            for (var i = subButtons.length - 1; i >= 0; i--) {
                subButtons[i].style.backgroundColor = colorNotEnabledDark
            }
        }
    }
})();
