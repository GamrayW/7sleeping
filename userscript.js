// ==UserScript==
// @name                7sleeping
// @namespace           .
// @version             0.1
// @description         Automating solve of 7speaking tests
// @author              Gamray
// @match               https://user.7speaking.com/*
// @icon                https://www.google.com/s2/favicons?sz=64&domain=7speaking.com
// @grant               none
// ==/UserScript==

(function() {
    'use strict';

    const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

    const enableButtonHtml = '<div style="padding-right: 80px;"><button id="time-to-sleep" class="MuiButtonBase-root-162 MuiButton-root-135 button MuiButton-containedPrimary-144"><span>7sleeping</span></button></div>'
    let enabled = false


    let allQuizzTypes = [ "fill", "grammar", "choice" ]

    /* CUSTOM FUNCTIONS */
    function unifyString(str) {
        // removing spaces to avoid problems
        return str.trimEnd()
    }

    function randint(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min)
    }


    /* QUIZZ RELATED FUNCTIONS */
    function getQuizzObject() {
        let question_div = document.querySelector(".question")
        if (question_div == undefined) { return undefined }

        let reactKey = Object.keys(question_div)[0]
        console.log("[DEBUG] - ", reactKey);

        let curr_kc = question_div[reactKey]

        // we go down in the object until we find "answerOptions" in the attributes
        while (curr_kc.memoizedProps.answerOptions == undefined) {
            curr_kc = curr_kc.return
            if (curr_kc == undefined) {
                return undefined
            }
        }
        return curr_kc.memoizedProps
    }

    // simply extract quizz type from quizz object
    function getQuizzType(quizz) {
        return quizz.variant
    }

    function getCurrentAnswer(quizz) {
        return unifyString(quizz.answerOptions.answer[0].value)
    }

    // handles form submit
    async function submitAnswer(answer, quizzType) {
        // checking we're still in the quizz
        let quizz_form = document.getElementsByClassName("question__form")[0]
        if (quizz_form == undefined) { return false }

        // extracting the submit button
        let submit = quizz_form.childNodes[2].getElementsByTagName("button")[0]

        if (quizzType == "fill") {
            let input_field = quizz_form.getElementsByTagName("input")[0]

            let reactKey = Object.keys(input_field)[0]

            input_field[reactKey].memoizedProps.onChange({currentTarget: {value: answer}})

            submit.classList.remove("Mui-disabled")
            submit.disabled = false
        } else if (quizzType == "grammar" || quizzType == "choice") {
            let choices = quizz_form.childNodes[0].childNodes

            let correct = false
            choices.forEach(function(choice) {
                let value = unifyString(choice.childNodes[0].innerHTML)
                console.log("[DEBUG] - Choice: " + value)
                if (value == answer) {
                    choice.click()
                    correct = true
                }})

            if (correct == false) {
                console.log("[DEBUG] - Could not find the answer in the choices, exiting...")
                return false
            }
        }

        submit.click()  // validate
        await sleep(randint(1000, 2500))
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
                click7Sleeping()
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
                click7Sleeping()
                return false
            }
            await sleep(1500)
        }
    }

    setTimeout(once_loaded, 1000);

    async function once_loaded() {
        while (true) {
            let our_button = document.getElementById('time-to-sleep')
            if (our_button == undefined && document.getElementsByClassName("quiz__container") != undefined) {
                console.log("Found a quizz !")
                if (document.getElementsByClassName("stepper")[0] != undefined) {
                    document.getElementsByClassName("stepper")[0].innerHTML += enableButtonHtml

                    our_button = document.getElementById('time-to-sleep')

                    our_button.style.backgroundColor = "#FF3364"
                    our_button.style.color = "#FFFFFF"
                    our_button.style.border = 0
                    our_button.style.cursor = "pointer"
                    our_button.style.padding = "5px 16px 7px 16px"
                    our_button.style.minWidth = "11.25rem"
                    our_button.style.minHeight = "1.8rem"
                    our_button.style.fontFamily = '"sofia-pro", "Arial", sans-serif'
                    our_button.style.borderRadius = "6px"

                    our_button.addEventListener ("click", click7Sleeping, false);
                }
            }
            await sleep(1000)
        }
    }

    function click7Sleeping() {
        let button = document.getElementById('time-to-sleep')
        enabled = !enabled
        if (enabled) {
            button.style.backgroundColor = "#76DED7"
            solveCurrentQuizz()
        } else {
            button.style.backgroundColor = "#FF3364"
        }
    }
})();