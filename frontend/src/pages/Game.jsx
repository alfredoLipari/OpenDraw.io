import { useEffect, useRef, useState } from "react";
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
} from "@chakra-ui/react";
import { useScreenshot } from "use-react-screenshot";
import { DeleteIcon } from "@chakra-ui/icons";

export const Game = () => {
    const { colorMode } = useColorMode();

    const canvasRef = useRef(null);
    const contextRef = useRef(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [penColor, setPenColor] = useState("black");
    const [isErasing, setIsErasing] = useState(false);
    const [eraserSize, setEraserSize] = useState(3);

    const [image, takeScreenshot] = useScreenshot();
    const getImage = () => takeScreenshot(canvasRef.current);

    const [imageToGuess] = useState("bat");

    console.log("image", image);

    const lastPosition = useRef({ x: 0, y: 0 });

    useEffect(() => {
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
    }, [colorMode]);

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

    const finishDrawing = () => {
        setIsDrawing(false);
        contextRef.current.closePath();  // Only close the path here
        getImage();
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
        const cursorSize =  eraserSize;
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


    useEffect(() => {
        const context = contextRef.current;
        context.lineWidth = eraserSize;
        
        updateCursor();
    }, [penColor, isErasing, eraserSize]);

    return (
        <>
            <Alert status="info" alignItems="center" justifyContent="center">
                <AlertIcon />
                Draw a {imageToGuess}
            </Alert>
            <VStack align={"center"} justify={"center"} mt={10}>
                <Text p={5} fontSize="lg">
                    The bot is thinking...
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
                        {isErasing ? "Pen" : "Eraser"}
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
    );
};
