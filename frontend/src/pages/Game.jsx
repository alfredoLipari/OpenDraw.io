import { useEffect, useRef, useState } from "react"; 
import { Text, VStack, useColorMode, Button, Flex, Alert,
    AlertIcon,
    Input,
     } from '@chakra-ui/react'
import { useScreenshot } from "use-react-screenshot";

export const Game = () => {

    const {colorMode} = useColorMode();

    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    
    const [isDrawing, setIsDrawing] = useState(false);
    const [penColor, setPenColor] = useState('black');
    const [isErasing, setIsErasing] = useState(false);

    const [image, takeScreenshot] = useScreenshot();
    const getImage = () => takeScreenshot(canvasRef.current);

    // take the screesnshot of only the drawing and not the whole canvas


    const [imageToGuess] = useState('bat');

    console.log('image', image)

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.width = `${window.innerWidth / 2}px`;
        canvas.style.height = `${window.innerHeight / 2}px`;

        if(colorMode === 'light'){
            canvas.style.background = '#EDF2F7';
        }else{
            canvas.style.background = '#718096';
        }

        // add border radius
        canvas.style.borderRadius = '10px';

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
        
        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const finishDrawing = () => {
        contextRef.current.closePath();
        setIsDrawing(false);

        getImage();
    };

    const draw = ({ nativeEvent }) => {
        if (!isDrawing) {
            return;
        }
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.strokeStyle = isErasing ? canvasRef.current.style.background : penColor;
        contextRef.current.stroke();
    };

    const cleanCanvas = () => {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
    };

    return (
        <>
        <Alert status='info'alignItems='center'
  justifyContent='center' >
    <AlertIcon />
    Draw a {imageToGuess}
  </Alert>
        <VStack align={'center'}
              justify={'center'}
              mt={10}
              >
                
        <Text p={5} fontSize='lg'>The bot is thinking... </Text>

        <canvas
            onMouseDown={startDrawing}
            onMouseUp={finishDrawing}
            onMouseMove={draw}
            ref={canvasRef}
            style={{ background: "white" }}
        />
        <Flex width="100%" justifyContent="center" direction={{base: 'column', md: 'row'}} alignItems="center" >
            <Input type="color" value={penColor} onChange={(e) => { setPenColor(e.target.value); setIsErasing(false); }} width={{base: '100%', md: '15%'}} mt={1} />
            <Button onClick={() => setIsErasing(!isErasing)} width={{base: '100%', md: '15%'}} mt={1} mx={1}>{isErasing ? 'Use Pen' : 'Use Eraser'}</Button>
            <Button onClick={() => cleanCanvas()} width={{base: '100%', md: '15%'}} mt={1}>Clean</Button>
        </Flex>
        </VStack>
        </>
    );

}



