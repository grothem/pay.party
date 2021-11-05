import { ChevronLeftIcon } from "@chakra-ui/icons";
import { Avatar, Box, Button, Heading, Text } from "@chakra-ui/react";
import { useHistory } from "react-router-dom";
import { blockExplorer } from "../../App";
import AddressChakra from "../AddressChakra";
import { PayButton } from "../../components";
import { fromWei } from "web3-utils";

function ElectionCard({
  electionState,
  mainnetProvider,
  endElection,
  isEndingElection,
  address,
  spender,
  yourLocalBalance,
  readContracts,
  writeContracts,
  ethPayHandler,
  tokenPayHandler,
}) {
  const routeHistory = useHistory();
  function goBack() {
    routeHistory.push("/");
  }

  return (
    <Box py="1.5rem" px="2.5rem">
      <Text w="fit-content" onClick={goBack} _hover={{ cursor: "pointer" }} pb="2rem">
        <ChevronLeftIcon />
        Back
      </Text>
      {electionState && !electionState.active && electionState.isPaid && (
        <Text fontSize="1rem" color="green.500" mb="0">
          PAID
        </Text>
      )}
      <Heading fontSize="1.5rem" color="violet.50">
        {electionState.name}
      </Heading>
      <Text pb="1rem" fontSize="1rem">
        {electionState.description}
      </Text>
      <Text fontSize="1rem" color="violet.500">
        Admin
      </Text>
      {/* <Text pt="1rem" pb="2rem">
        <Avatar mr="0.5rem" boxSize="1.5em" src="https://siasky.net/AAB-yQ5MuGLqpb5fT9w0gd54RbDfRS9sZDb2aMx9NeJ8QA" />
        {creator}
      </Text> */}
      <AddressChakra
        address={electionState.creator}
        ensProvider={mainnetProvider}
        blockExplorer={blockExplorer}
        pb="1rem"
      ></AddressChakra>
      <Text pt="1rem" fontSize="1rem" color="violet.500" mb="0">
        Total Funds
      </Text>
      <Text>
        {electionState.fundAmount ? `${electionState.fundAmount} ${electionState.tokenSymbol}` : "Loading..."}
      </Text>
      <Text fontSize="1rem" color="violet.500" mb="0">
        Voters
      </Text>
      <Text>
        {electionState.n_voted ? `${electionState.n_voted.n_voted} / ${electionState.n_voted.outOf} Voted` : "Loading..."} 
      </Text>
      <Text fontSize="1rem" color="violet.500" mb="0">
        Status
      </Text>
      <Text>{electionState.active ? "Active" : "Inactive"}</Text>
      <Text fontSize="1rem" color="violet.500" mb="0">
        Created on
      </Text>
      <Text pb="2rem">{electionState.created_date}</Text>
     
    </Box>
  );
}

export default ElectionCard;
