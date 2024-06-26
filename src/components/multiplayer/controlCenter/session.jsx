import {useState} from "react";
import * as exports from "../../../exports.js"

export default function Session( {toggle} ) {
    const [anonGameSession, setAnonGameSession] = useState("")
    const [gameId, setGameId] = useState(() => sessionStorage.getItem('gameId') || "");
    const [isAlert, setIsAlert] = useState(false)
    const [alertText, setAlertText] = useState("")

    const handleAlert = () => setIsAlert(prev => !prev)

    const handleJoinSession = () => {
        sessionStorage.setItem("gameId", anonGameSession)
        setGameId(anonGameSession)
        window.location.reload()
    }

    const copyToClipboard = () => {
        if (!navigator.clipboard) {
            copyToClipboardFallback(gameId);
            return;
        }

        navigator.clipboard.writeText(gameId).then(() => {
            setAlertText("Invitation code copied to clipboard!")
            setIsAlert(true)
        });
    };

    const copyToClipboardFallback = (text) => {
        // Create a temporary textarea
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select(); // Select the text
        try {
            const successful = document.execCommand('copy'); // Attempt to copy
            if (successful) {
                setAlertText("Invitation code copied to clipboard!")
                setIsAlert(true)
            }
        } catch (err) {
            setAlertText("Oops, unable to copy!")
            setIsAlert(true)
        }
        document.body.removeChild(textarea); // Clean up
    };

    return (
        <div>
            <exports.Backdrop />
            <div className={"fixed inset-0 flex justify-center items-center"} onClick={() => toggle()}>
                <div className={"bg-gray-800 rounded-md py-10 w-[90vw] sm:w-auto -mx-auto"}
                     onClick={(e) => e.stopPropagation()}
                >
                    <div className={"px-5"}>
                        <div className="text-lg mb-4 flex items-center space-x-2">
                            <div className="bg-gray-700 border border-gray-600 rounded-md px-2 max-w-xs overflow-hidden text-ellipsis">
                                Invitation code: <span className="font-bold">{gameId}</span>
                            </div>
                            <button onClick={copyToClipboard} className="bg-green-600 hover:bg-green-700 rounded-md shadow px-2 py-1">
                                Copy
                            </button>
                        </div>
                        <div className="space-y-2">
                            <input
                                type="text"
                                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={anonGameSession}
                                onChange={(e) => setAnonGameSession(e.target.value)}
                                placeholder="Enter session ID"
                            />
                            <button onClick={handleJoinSession} className="w-full bg-blue-600 hover:bg-blue-700 rounded-md shadow py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out">
                                Join Game
                            </button>
                        </div>

                    </div>
                </div>
            </div>
            {isAlert && <exports.InfoAlert text={alertText} toggle={handleAlert} /> }
        </div>
    )
}