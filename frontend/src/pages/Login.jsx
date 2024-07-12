import {
  Flex,
  Box,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Button,
  Heading,
  Text,
  useColorModeValue,
  FormErrorMessage,
  Center,
  useToast
} from '@chakra-ui/react'
import { useContext, useState } from 'react'
import { GlobalContext } from '../context/globalContext'
import { useNavigate } from "react-router-dom";
import { instance } from '../../axios';

export const Login = () => {

  const {dispatch} = useContext(GlobalContext)
  const [inputUsername, setInputUsername] = useState('')
  const [inputPassword, setInputPassword] = useState('')

  const [isSigningUp, setIsSigningUp] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const toastLogin = useToast()

  const navigate = useNavigate()

  const handleSubmit = async () => {
    setIsLoading(true)
    const title = isSigningUp ? "Trying to Sign up.." : "Trying to Login.."
    toastLogin({
      title: title,
      description: "Please wait",
      status: "loading",
      duration: 2000,
      isClosable: true,
    })
    let data = '';
    try{
      if(isSigningUp) {
        data = await instance.post('api/v1/register', {
          username: inputUsername,
          password: inputPassword
        })
        console.log(data)
        if(data.status !== 200) {
          setIsLoading(false)
          return;
        }else{
          toastLogin({
            title: "Account created!",
            description: "Trying to login..",
            status: "loading",
            duration: 3000,
            isClosable: true,
          })
        }
      }
      data = await instance.post('api/v1/login', {
        username: inputUsername,
        password: inputPassword
      })
      console.log(data)
    
      toastLogin({
        title: "Login successful!",
        description: "Redirecting..",
        status: "success",
        duration: 2000,
        isClosable: true,
      })

      // add bearer token to the header
      instance.defaults.headers.common['Authorization'] = `Bearer ${data.data.access_token}`

      instance.get('api/v1/user').then((res) => {
        console.log('score', res)
        if (res.status === 200) {
          dispatch({ type: 'SET_SCORE', payload: res.data.score })
        } else {
          console.log(res)
        }
      });

       
    }catch(e) {
      console.log(e)
      setIsLoading(false)

      if(e.response.status !== 200) {
        setIsLoading(false)
        toastLogin({
          title: "An error occured!",
          description: e?.response?.data?.detail,
          status: "error",
          duration: 5000,
          isClosable: true,
        })
        return;
      }
    }

    setIsLoading(false)
    dispatch({ type: 'SET_USERNAME', payload: {
      username: inputUsername,
      access_token: data.data.access_token,
      token_type: data.data.token_type,
      password: inputPassword
    }})
    
    navigate('/game')
  }

  const handleInputUsername = (event) => {
    setInputUsername(event.target.value)
  }

  const isError = inputUsername === ''

  return (
    <Flex
    minH={'100vh'}
    bg={useColorModeValue('gray.50', 'gray.800')}
    >
    <Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6} mt={40}>
      <Stack align={'center'}>
        <Heading fontSize={'4xl'} textAlign={'center'}>

          { !isSigningUp ? 'Insert your credentials' : 'Create an account 🎨'}

        </Heading>
        <Text fontSize={'lg'} color={'gray.600'}>
          to start a game of drawing with our bot ✌️
        </Text>
      </Stack>
      <Box
        rounded={'lg'}
        bg={useColorModeValue('white', 'gray.700')}
        boxShadow={'lg'}
        p={8}>
        <Stack spacing={4}>
          <FormControl id="text" isRequired isInvalid={isError}>
            <FormLabel>Username</FormLabel>
            <Input type="text" value={inputUsername} onChange={handleInputUsername}/>
            {isError && <FormErrorMessage>Username is required</FormErrorMessage>}
          </FormControl>
          <FormControl id="password" isRequired>
            <FormLabel>Password</FormLabel>
            <Input type="password" value={inputPassword} onChange={(event) => setInputPassword(event.target.value)}/>
          </FormControl>
          <Stack spacing={10} pt={2}>
            <Button
              onClick={() => {
                if (!isError) {
                  handleSubmit()
                }
              }}
              loadingText="Submitting"
              size="lg"
              bg={'blue.400'}
              color={'white'}
              _hover={{
                bg: 'blue.500',
              }}>
                { !isSigningUp ? 'Start' : 'Sign up' }
            </Button>
          </Stack>
        </Stack>
      </Box>
        <Center fontSize={'md'} color={'gray.600'}>
        <Button
                fontSize={"sm"}
                fontWeight={400}
                variant={"link"}
                href={""}
                isLoading={isLoading}
                onClick={() => setIsSigningUp(!isSigningUp)}
              >
                { !isSigningUp ? 'Create an account' : 'Already have an account?'}
              </Button>
        </Center>

    </Stack>
  </Flex>
  )
}
