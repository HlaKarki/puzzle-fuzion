import {useEffect, useState} from "react";
import * as exports from "../../exports.js"
import {useQuery} from "@tanstack/react-query";
import {useMutation, useQuery as convexQuery} from "convex/react"
import {api} from "../../../convex/_generated/api.js";

export default function Keyboard( {gameId} ) {
    const keyboard_keys = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['Enter', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'hla']
    ]

    const toggleGameDone = useMutation(api.games.toggleGameDone)
    const submitGuess = useMutation(api.games.submitGuess)
    const updateGuess = useMutation(api.games.updateGuess)
    const removeGuess = useMutation(api.games.removeGuess)
    const gameDetails = convexQuery(api.games.getGame, { _id: gameId });
    const [guesses, setGuesses] = useState([])


    const [wordToCheck, setWordToCheck] = useState('')
    const [prevWord, setPrevWord] = useState("")
    const [checkWord, setCheckWord] = useState(false);
    const [letterStatuses, setLetterStatuses] = useState({});
    const [gameDone, setGameDone] = useState(false)

    const [statuses, setStatuses] = useState([])
    const [cursor, setCursor] = useState([])
    const [wordleWord, setWordleWord] = useState("")

    useEffect( () => {
        if (gameDetails) {
            setGuesses(() => {
                console.log("keyboard, gameDetails: ", gameDetails)
                return gameDetails.guesses
            })
            setCursor(() => {
                return gameDetails.cursor
            })
            setWordleWord(() => {
                return gameDetails.word
            })
            setStatuses( () => {
                return gameDetails.statuses
            })
            setGameDone( () => {
                return gameDetails.gameDone
            })
        }
    }, [gameDetails])

    const handleClick = (letter, event) => {
        if (!gameDone) {
            if (letter === "Enter") {
                handleSubmit()
                event.target.blur()
                return
            }
            else if (letter === "hla") {
                removeGuess({ _id: gameId, cursor: cursor} )
                    .then(res => res ? true : alert("something went wrong!"))

                event.target.blur()
                return
            }

            updateGuess({ _id: gameId, cursor: cursor, letter: letter.toLowerCase()} )
                .then(res => res ? true : alert("something went wrong!"))

            event.target.blur()
        }
    }

    const handleSubmit = () => {
        if (!gameDone) {
            if (cursor[1] === 4) {
                const word = guesses[cursor[0]].join('');
                console.log("guess: ", word)

                if (cursor[0] > 0 && guesses[cursor[0]-1].join('') === guesses[cursor[0]].join('')) {
                    alert("You entered the same word again!")
                }
                setWordToCheck(word)
                setCheckWord(true)
            }
            else {
                alert("Please enter five letters to guess!")
            }
        }
    }

    // Listen for the Enter key press
    useEffect(() => {
        const handleKeyPress = (event) => {
            const tagName = document.activeElement.tagName.toLowerCase();
            if (tagName === 'input' || tagName === 'textarea') {
                // If so, ignore the key press
                return;
            }

            // Check if any modifier key is pressed
            const isModifierKey = event.ctrlKey || event.altKey || event.shiftKey || event.metaKey;
            if (isModifierKey) {
                // Ignore the key press if it's part of a key combination
                return;
            }

            if (!gameDone) {
                if (event.key === 'Enter') {
                    handleSubmit();
                }
                else if (event.key >= 'a' && event.key <= 'z') {
                    updateGuess({ _id: gameId, cursor: cursor, letter: event.key.toLowerCase()} )
                        .then(res => res ? true : alert("something went wrong!"))
                }
                else if (event.key === 'Backspace') {
                    removeGuess({ _id: gameId, cursor: cursor} )
                        .then(res => res ? true : alert("something went wrong!"))
                }
            }
        };

        document.addEventListener('keydown', handleKeyPress);

        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [cursor, gameDone]);

    const {isLoading} = useQuery({
        queryKey: ["word", wordToCheck],
        queryFn: async () => {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${wordToCheck}`);
            if (!response.ok) {
                alert(`${wordToCheck} is an invalid word!`);
                return
            }
            const data = await response.json()

            if (data[0] && data[0].meanings.length > 0 && !gameDone && prevWord !== wordToCheck) {
                setPrevWord(wordToCheck)

                submitGuess({ _id: gameId, cursor: cursor, guess: wordToCheck} )
                    .then(result => {
                        console.log("from db, result: ", result)
                        updateLetterStatuses(result, wordToCheck)
                    })

                if (wordToCheck === wordleWord && !gameDone) {
                    // setGameDone(true)
                    toggleGameDone({ _id: gameId} )
                        .then(res => res ? true : alert("something went wrong!"))
                    alert("You guessed it right!");
                }
                else if(cursor[0] === 5) {
                    alert(`You lost! The word was ${wordleWord}`)
                    setGameDone(true)
                }
            }
            return data;
        },
        enabled: checkWord,
        onSettled: () => {
            setCheckWord(false);
        },
    });

    const updateLetterStatuses = (result, word) => {
        const newStatuses = {...letterStatuses};
        word.split('').forEach((char, index) => {
            // Only update if the new status is "higher" or if the letter hasn't been added yet
            const status = result[index];
            if (status === 'correct' || status === 'present' && newStatuses[char] !== 'correct' || !newStatuses[char]) {
                newStatuses[char.toUpperCase()] = status;
            }
        });
        setLetterStatuses(newStatuses);
    };
    const checkBackground = (letter) => {
        const status = letterStatuses[letter];
        switch (status) {
            case 'correct':
                return '#38A169'; // green
            case 'present':
                return '#ED8936'; // amber
            case 'absent':
                return '#A0AEC0'; // cool gray
            default:
                return 'rgb(129,131,132)'; // default keyboard background
        }
    };

    // Responsive button classes
    const buttonBaseClasses = "bg-pf-keyboard-background hover:bg-gray-400 " +
        "text-pf-light-text font-bold " +
        "rounded shadow " +
        "h-[7vh] select-none "
    const defaultButtonClasses = "w-[7.7vw] md:w-[4vw] ";
    const enterButtonClasses = "w-[13vw] p-1 text-[1rem] md:w-[6vw] ";
    const backButtonClasses = "w-[10vw] p-1 md:w-[5vw] md:p-2 ";

    return (
        <>
            <div className={"flex flex-col items-center justify-center gap-2 p-4 mx-auto max-h-[100%]"}>
                {keyboard_keys.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex justify-center gap-2 max-w-[90vw] md:max-w-[50vw] ">
                        {row.map((letter, letterIndex) => {
                            return (
                                <button
                                    style={{ backgroundColor: checkBackground(letter)}}
                                    key={`${rowIndex}-${letterIndex}`}
                                    className={`${buttonBaseClasses}` +
                                        `${letter === "Enter" ?
                                            `${enterButtonClasses}` : letter === "hla" ?
                                                `${backButtonClasses}` : `${defaultButtonClasses}`} `}
                                    onClick={(event) => handleClick(letter, event)}
                                    disabled={gameDone}
                                >
                                    {
                                        letter === 'hla' ?
                                            <img src={exports.keyboard_dark_mode_backspace} alt={"backspace"} /> :
                                            letter
                                    }
                                </button>
                            )
                        })}
                    </div>
                ))}
            </div>
            {isLoading && <exports.Loading />}
        </>
    )
}