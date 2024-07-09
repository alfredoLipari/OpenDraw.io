import { useState, useContext, useEffect } from 'react';
import { instance } from '../../axios';
import { useToast, Center, Table, Thead, Tbody, Tr, Th, Td, TableContainer } from '@chakra-ui/react';
import { GlobalContext } from '../context/globalContext';

export const History = () => {
    const { user } = useContext(GlobalContext);
    const [history, setHistory] = useState([]);
    const toast = useToast();

    useEffect(() => {
        instance.defaults.headers.common['Authorization'] = `Bearer ${user.access_token}`;
        instance.get('api/v1/tasks?size=100').then((res) => {
            if (res.status === 200) {
                setHistory(res.data.tasks);
            } else {
                toast({
                    title: "Error",
                    description: "Error fetching history",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
            }
        });
    }, []);

    const convertTimeStamps = (time) => {
        const date = new Date(time);
        return date.toLocaleDateString("en-US", {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'
        });
    };

    return (
        <Center p={5}>
            <TableContainer>
                <Table variant="simple" colorScheme="teal" size="md">
                    <Thead>
                        <Tr>
                            <Th>Created Date</Th>
                            <Th>Object to Guess</Th>
                            <Th>Status</Th>
                            <Th>Score</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {history.map((game, index) => (
                            <Tr key={index}>
                                <Td>{convertTimeStamps(game.created_on)}</Td>
                                <Td>{game.object_name}</Td>
                                <Td>{game.status}</Td>
                                <Td>{Math.round(game.score)}</Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </TableContainer>
        </Center>
    );
};
