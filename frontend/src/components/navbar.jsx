import { useContext } from "react";
import axios from "axios";
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
} from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { GlobalContext } from "../context/globalContext";

export const Navbar = () => {
  const { username } = useContext(GlobalContext);
  const { colorMode, toggleColorMode } = useColorMode();


  const handleLogout = () => {
    console.log('trying with api')
    axios.post("/api/").then((res) => {
      console.log(res);
    });
    
    //window.location.href = "/";
  }

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
                {colorMode === "light" ? <MoonIcon /> : <SunIcon />}
              </Button>
              <Button
                as={"a"}
                fontSize={"sm"}
                fontWeight={400}
                variant={"link"}
                href={"#"}
              >
                Leaderboard
              </Button>
              {username && (
                <Menu>
                <MenuButton
                  as={Button}
                  rounded={'full'}
                  variant={'link'}
                  cursor={'pointer'}
                  minW={0}>
                  {username}
                </MenuButton>
                <MenuList alignItems={'center'}>
                 
                  <MenuItem onClick={() => handleLogout()}>Logout</MenuItem>
                </MenuList>
              </Menu>
              )}
              
            </Stack>
          </Flex>
        </Flex>
      </Box>
    </>
  );
};
