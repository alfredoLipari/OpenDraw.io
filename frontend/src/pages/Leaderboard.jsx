import  {useEffect, useState, useContext} from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/navbar';

export const Layout = () => {
  return (
    <>
      <Navbar />
      <Outlet /> 
    </>
  );
};
import { instance } from '../../axios';
import {StarIcon} from "@chakra-ui/icons";
import { VStack, Flex, Heading, List, ListIcon, ListItem, Text, Grid} from "@chakra-ui/react";
import { GlobalContext } from '../context/globalContext';

export const Leaderboard = () => {

    const user = useContext(GlobalContext)

    const [topTenUsers, setTopTenUsers] = useState([])


    useEffect(() => {

        // add bearer token to the header
        instance.defaults.headers.common['Authorization'] = `Bearer ${user.access_token}`


        instance.get('api/v1/leaderboard').then((res) => {
            if (res.status === 200) {
                console.log(res)
                setTopTenUsers(res.data.users)
            } else {
                console.log(res)
            }
        });

    }, [])

    const calcualteBg = (index) => {
        switch(index){
            case 0:
                return 'linear(to-l, blue.theme, blue.200)'
            case 1: 
                return 'linear(to-l, pink.200, pink.400)'   
            case 2: 
                return 'linear(to-l, yellow.200, yellow.400)'     
            default:
                return 'linear(to-l, gray.200, green.400)'  
        }
       
            
    }

    return (
        <>
        <VStack >
            <Heading as={'h1'} mt={5}>Leaderboard</Heading>
            <Heading as='h3' mb={4} size='md'>Here Are listed the top 100 players</Heading>
            <Grid  templateColumns="repeat(2, 1fr)" templateRows="auto" gap={2}>
            <Flex justifyContent="space-between" width='100%' gridColumn="span 2" px="3">
                <Text fontWeight='bold' as='samp'>Username</Text>
                <Text fontWeight='bold' as='samp'>Total Score</Text>
            </Flex>
                <List spacing={5} gridColumn="span 2">
                    {topTenUsers?.map((u, key) => (
                        <ListItem key={key}>
                            <Flex  bgGradient={calcualteBg(key)} width="15em" p={1} borderRadius={10} flexDir="row-inverse" alignItems="center">

                                {key === 0 && <ListIcon as={StarIcon} color='blue.theme' bg="white" borderRadius={10} focusable="false" p={1}/>}
                                <Flex justifyContent="space-between" width='100%'>
                                    <Text > {u.username}</Text>
                                    <Text pr={1} mr={1}> {Math.round(u.score)}</Text>
                                </Flex>   
                            </Flex>
                        </ListItem>

                    ))}
                </List>
            </Grid>  
        </VStack>
        </>
    )
}