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
} from '@chakra-ui/react'
import { useContext, useState } from 'react'
import { GlobalContext } from '../context/globalContext'
import { useNavigate } from "react-router-dom";

export const Login = () => {

  const {dispatch} = useContext(GlobalContext)
  const [inputUsername, setInputUsername] = useState('')

  const navigate = useNavigate()

  const handleSubmit = () => {
    dispatch({ type: 'SET_USERNAME', payload: inputUsername })
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
          Choose an username!!
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
              Start
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  </Flex>
  )
}
