import { useContext } from "react";
import {
  Box,
  Flex,
  Button,
  useColorModeValue,
  Stack,
  useColorMode,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
} from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { GlobalContext } from "../context/globalContext";
import { useNavigate } from "react-router-dom";

export const Navbar = () => {
  const { user } = useContext(GlobalContext);
  const { colorMode, toggleColorMode } = useColorMode();

  console.log(user);
  const handleLogout = () => {
    
    window.location.href = "/";
  }

  const navigate = useNavigate();

  return (
    <>
      <Box bg={useColorModeValue("gray.100", "gray.900")} px={4}>
        <Flex h={16} alignItems={"center"} justifyContent={"space-between"}>
          <Text fontSize="lg" as="b">
            OpenDraw.io
          </Text>

          <Flex alignItems={"center"}>
            <Stack direction={"row"} spacing={7}>
              <Button onClick={toggleColorMode}>
                {colorMode !== "light" ? <MoonIcon /> : <SunIcon />}
              </Button>
             
              {user.username && (
                <>
                 <Button
                 fontSize={"sm"}
                 fontWeight={400}
                 variant={"link"}
                 onClick={() => navigate('/game')}
                 colorScheme='blue'
               >
                 Play
               </Button>
               <Button
                 fontSize={"sm"}
                 fontWeight={400}
                 variant={"link"}
                 onClick={() => navigate('/history')}
               >
                 History
               </Button>
               <Button
                 fontSize={"sm"}
                 fontWeight={400}
                 variant={"link"}
                 onClick={() => navigate('/leaderboard')}
               >
                 Leaderboard
               </Button>
                <Menu>
                  
                <MenuButton
                  as={Button}
                  rounded={'full'}
                  variant={'link'}
                  cursor={'pointer'}
                  minW={0}>
                  {user.username}
                </MenuButton>

                
                <MenuList alignItems={'center'}>
                 
                  <MenuItem onClick={() => handleLogout()}>Logout</MenuItem>
                  <MenuDivider />
                  <MenuItem>Total Score: {Math.round(user.score)}</MenuItem>
                </MenuList>
              </Menu>
              </>
              )}
              
            </Stack>
          </Flex>
        </Flex>
      </Box>
    </>
  );
};
