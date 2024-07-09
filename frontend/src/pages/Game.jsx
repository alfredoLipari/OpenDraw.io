import { useEffect, useRef, useState, useContext } from "react";
import {
    Text,
    VStack,
    useColorMode,
    Button,
    Stack,
    Alert,
    AlertIcon,
    Input,
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    Center,
    Spinner,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure
} from "@chakra-ui/react";
import { useScreenshot } from "use-react-screenshot";
import { DeleteIcon } from "@chakra-ui/icons";
import { instance } from "../../axios";
import { GlobalContext } from "../context/globalContext";
import { useNavigate } from "react-router-dom";

export const Game = () => {
    const { colorMode } = useColorMode();

    const canvasRef = useRef(null);
    const contextRef = useRef(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [penColor, setPenColor] = useState("black");
    const [isErasing, setIsErasing] = useState(false);
    const [eraserSize, setEraserSize] = useState(3);

    const [, takeScreenshot] = useScreenshot();
    const [isLoading, setIsLoading] = useState(true);
    const getImage = () => takeScreenshot(canvasRef.current);

    const [task, setTask] = useState(null);

    const [isGameStarted, setIsGameStarted] = useState(false);

    const [aiSays, setAiSays] = useState("");

    const lastPosition = useRef({ x: 0, y: 0 });

    const { isOpen, onOpen, onClose } = useDisclosure()
    const {
        isOpen: isOpenGameOver,
        onOpen: onOpenGameOver,
        onClose: onCloseGameOver
    } = useDisclosure()
    const {
        isOpen: isGameWon,
        onOpen: onGameWon,
        onClose: onGameWonClose
    } = useDisclosure()

    const { user } = useContext(GlobalContext);

    const [timer, setTimer] = useState(60);

    const navigate = useNavigate();

    const onClosemodal = () => {
        setIsGameStarted(true)
        onClose()

    }

    useEffect(() => {

        if (!isGameStarted) {
            if(task?.status === "completed"){
                return;
            }
            onOpen()
            return;
        }

        // add to the instance axios the bearer token
        instance.defaults.headers.common['Authorization'] = `Bearer ${user.access_token}`;
        try{
            instance.post("/api/v1/task").then((res) => {
                console.log(res);
                
                setTask(res.data);
                setIsLoading(false);
                
                
            });
        }catch(e){
            console.log(e)
        }
       
    }, [isGameStarted]);

    useEffect(() => {
        let interval = null;

        if (isLoading) {
            return;
        }

        if (isGameStarted && timer > 0) {
            interval = setInterval(() => {
                setTimer((prevTimer) => prevTimer - 1);
            }, 1000);
        } else if (timer === 0) {
            onOpenGameOver() // Stop the game
        }

        return () => clearInterval(interval); // Clean up the interval on component unmount
    }, [isGameStarted, timer, isLoading]);

    useEffect(() => {
        if (isLoading) {
            return;
        }

        if ((task?.status === "running" && task?.status === "completed" ) && timer < 57) {
            return;
        }

        const canvas = canvasRef.current;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.width = `${window.innerWidth / 2}px`;
        canvas.style.height = `${window.innerHeight / 2}px`;

        if (colorMode === "light") {
            canvas.style.background = "#EDF2F7";
        } else {
            canvas.style.background = "#718096";
        }

        canvas.style.borderRadius = "10px";

        const context = canvas.getContext("2d");
        context.scale(2, 2);
        context.lineCap = "round";
        context.lineJoin = "round";
        context.globalAlpha = 1;
        context.lineWidth = 3;
        contextRef.current = context;
    }, [colorMode, task]);

    useEffect(() => {
        if (isLoading) {
            return;
        }
        const context = contextRef.current;
        context.lineWidth = eraserSize;

        updateCursor();
    }, [penColor, isErasing, eraserSize, task]);

    const startDrawing = ({ nativeEvent }) => {
        const { offsetX, offsetY } = nativeEvent;
        lastPosition.current = { x: offsetX, y: offsetY };

        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);

        if (isErasing) {
            contextRef.current.globalCompositeOperation = 'destination-out';
            contextRef.current.lineWidth = eraserSize;
        } else {
            contextRef.current.globalCompositeOperation = 'source-over';
            contextRef.current.strokeStyle = penColor;
            contextRef.current.lineWidth = 3;
        }

        // Draw a small dot
        contextRef.current.lineTo(offsetX + 0.1, offsetY + 0.1);
        contextRef.current.stroke();

        setIsDrawing(true);
    };

    const finishDrawing = async () => {
        setIsDrawing(false);  // Only close the path here
        const image = await getImage();
        console.log("image after drawing", image);
        const resized_image = await reduce_image_file_size(image);
        console.log("resized image after drawing", resized_image);
        guessImage(resized_image);
    };

    const guessImage = async (image) => {

        // add bearer token to the axios instance
        instance.defaults.headers.common['Authorization'] = `Bearer ${user.access_token}`;
        const response = await instance.post("/api/v1/guess/" + task.id, {
            image_b64: image,
        });
        console.log(response.data);
        setAiSays(response.data.ai_says);

        // check if the bot has guessed the object
        if (response.data.status === "completed") {
            onGameWon();
            const timerNow = timer;
            setTimer(timerNow);
            setIsGameStarted(false);
            setTask(response.data);

        }
    };

    const draw = ({ nativeEvent }) => {
        if (!isDrawing) return;

        const { offsetX, offsetY } = nativeEvent;

        requestAnimationFrame(() => {
            if (isErasing) {
                contextRef.current.globalCompositeOperation = 'destination-out';
                contextRef.current.lineWidth = eraserSize;
            } else {
                contextRef.current.globalCompositeOperation = 'source-over';
                contextRef.current.strokeStyle = penColor;
                contextRef.current.lineWidth = 3;
            }

            contextRef.current.lineTo(offsetX, offsetY);
            contextRef.current.stroke();  // Apply the current stroke without closing the path

            lastPosition.current = { x: offsetX, y: offsetY };
        });
    };

    const cleanCanvas = () => {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
    };

    const updateCursor = () => {
        console.log('eraserSize', eraserSize)
        const canvas = canvasRef.current;
        const cursorSize = eraserSize;
        const cursorColor = isErasing ? 'white' : penColor;
        const cursorBorderColor = isErasing ? 'grey' : cursorColor;

        // Encode the SVG properly to ensure it's applied as a cursor
        const cursorSVG = encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' width='${cursorSize}' height='${cursorSize}' viewBox='0 0 ${cursorSize} ${cursorSize}'>
            <circle cx='${cursorSize / 2}' cy='${cursorSize / 2}' r='${cursorSize / 2 - 1}' stroke='${cursorBorderColor}' stroke-width='2' fill='${cursorColor}'/>
        </svg>`
        );

        const cursorStyle = `url("data:image/svg+xml,${cursorSVG}") ${cursorSize / 2} ${cursorSize / 2}, auto`;
        canvas.style.cursor = cursorStyle;
    };

    const changeMode = () => {
        setIsErasing(!isErasing);
        setEraserSize(3);
    }

    async function reduce_image_file_size(base64Str, MAX_WIDTH = 450, MAX_HEIGHT = 450) {
        let resized_base64 = await new Promise((resolve) => {
            let img = new Image()
            img.src = base64Str
            img.onload = () => {
                let canvas = document.createElement('canvas')
                let width = img.width
                let height = img.height

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width
                        width = MAX_WIDTH
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height
                        height = MAX_HEIGHT
                    }
                }
                canvas.width = width
                canvas.height = height
                let ctx = canvas.getContext('2d')
                ctx.drawImage(img, 0, 0, width, height)
                // return base64 string
                let dataURL = canvas.toDataURL();
                let base64String = dataURL.split(',')[1]; // Splits the string on comma and gets the second part (Base64 data)
                resolve(base64String);
            }
        });
        return resized_base64;
    }

    const restartGame = () => {
        setTimer(60);
        setTask(null);
        setIsGameStarted(true);
        onGameWonClose();
        onCloseGameOver();
    }




    return (
        <>
            {isLoading ? <Center height="100hv">
                <Spinner
                    thickness='4px'
                    speed='0.65s'
                    emptyColor='gray.200'
                    color='blue.500'
                    size='xl'
                />
                Loading...


            </Center> :
                <>
                    <Alert status="info" alignItems="center" justifyContent="space-between">
                        <Stack direction="row">
                            <AlertIcon />
                            <b>Draw a {task?.object_name}</b>
                        </Stack>
                        <b>Time left: {timer} seconds </b>
                    </Alert>
                    <VStack align={"center"} justify={"center"} mt={10}>
                        <Text p={5} fontSize="lg">
                            The bot is thinking...{aiSays}
                        </Text>
                        <canvas
                            onMouseDown={startDrawing}
                            onMouseUp={finishDrawing}
                            onMouseMove={draw}
                            ref={canvasRef}
                            style={{ background: "white" }}
                        />
                        <Stack
                            width="100%"
                            justifyContent="center"
                            direction={{ base: "column", md: "row" }}
                            alignItems="center"
                        >
                            <Button
                                colorScheme="blue"
                                variant="outline"
                                rightIcon={<>{!isErasing ? "🖋️" : "🧽"}</>}
                                onClick={() => changeMode()}
                                width={{ base: "100%", md: "15%" }}
                                mt={1}
                                mx={1}
                            >
                                {!isErasing ? "Pen" : "Eraser"}
                            </Button>
                            {isErasing ? (
                                <Slider
                                    aria-label="slider-ex-1"
                                    defaultValue={3}
                                    min={3}
                                    max={30}
                                    onChange={(val) => setEraserSize(val)}
                                    width={{ base: "100%", md: "15%" }}
                                    mt={1}
                                >
                                    <SliderTrack>
                                        <SliderFilledTrack />
                                    </SliderTrack>
                                    <SliderThumb />
                                </Slider>
                            ) : (
                                <Input
                                    type="color"
                                    value={penColor}
                                    onChange={(e) => {
                                        setPenColor(e.target.value);
                                        setIsErasing(false);
                                    }}
                                    width={{ base: "100%", md: "15%" }}
                                    mt={1}
                                />
                            )}
                            <Button
                                rightIcon={<DeleteIcon />}
                                onClick={() => cleanCanvas()}
                                colorScheme="teal"
                                width={{ base: "100%", md: "15%" }}
                                mt={1}
                            >
                                Clean
                            </Button>
                        </Stack>
                    </VStack>
                </>
            }


            <Modal closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Welcome to OpenDraw io!</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        By clicking continue, your game and a timer will start. You will have 60 seconds to draw the object and let the bot guess it, You win if the bot can guess your drawing
                        before the timer elapse. Good luck!
                    </ModalBody>

                    <ModalFooter>
                        <Center>
                        <Button colorScheme='blue' variant={"blue"} mr={3} onClick={() => navigate("/history")}>
                            Game History
                        </Button>
                        <Button colorScheme='blue' mr={3} onClick={() => navigate("/leaderboard")}>
                            Leaderboard
                        </Button>
                            <Button colorScheme='blue' mr={3} onClick={onClosemodal}>
                                Start
                            </Button>
                        </Center>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Modal closeOnOverlayClick={false} isOpen={isOpenGameOver} onClose={onCloseGameOver} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Game Over</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        Time is up! Better luck next time. Do you want to play again?
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme='blue' variant={"blue"} mr={3} onClick={() => navigate("/history")}>
                            Game History
                        </Button>
                        <Button colorScheme='blue' mr={3} onClick={() => navigate("/leaderboard")}>
                            Leaderboard
                        </Button>
                        <Button colorScheme='blue' mr={3} onClick={() => restartGame()}>
                            Play Again
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Modal closeOnOverlayClick={false} isOpen={isGameWon} onClose={onGameWonClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Game Over</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        Congratulations! You have won the game. One more game?
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme='blue' variant={"blue"} mr={3} onClick={() => navigate("/history")}>
                            Game History
                        </Button>
                        <Button colorScheme='blue' mr={3} onClick={() => navigate("/leaderboard")}>
                            Leaderboard
                        </Button>
                        <Button colorScheme='blue' mr={3} onClick={() => restartGame()}>
                            Play Again
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};
