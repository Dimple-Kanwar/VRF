// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

contract VRF  {
    address private _owner;

    struct RequestStatus {
        bool fulfilled; // whether the request has been successfully fulfilled
        bool exists; // whether a requestId exists
        address signer; // account address of the requester
        bytes signature;
        bytes randomWords;
    }
    mapping(uint256 => RequestStatus) private s_requests; /* requestId --> requestStatus */


    // past requests Id.
    uint256[] public requestIds;
    uint256 public lastRequestId;

    constructor()
    {
        _owner = msg.sender;
    }

    // Modifier to check that the caller is the owner of
    // the contract.
    modifier onlyOwner() {
        require(msg.sender == _owner, "Not owner");
        // Underscore is a special character only used inside
        // a function modifier and it tells Solidity to
        // execute the rest of the code.
        _;
    }

    function init(uint256 _requestId, address signer) public onlyOwner{
        s_requests[_requestId] = RequestStatus({
            randomWords: "",
            signer: signer,
            signature: "",
            exists: true,
            fulfilled: false
        });
        requestIds.push(_requestId);
    }

    function getMessageHash(
        bytes memory _randomWords
    ) private  pure returns (bytes32) {
        return keccak256(abi.encodePacked(_randomWords));
    }

    function setRandomWords(bytes memory _randomWords, bytes memory _signature, address signer, uint256 _requestId) public onlyOwner returns (uint256 requestId) {
        bytes32 messageHash = getMessageHash(_randomWords);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        require(recoverSigner(ethSignedMessageHash, _signature) == signer, "Signer mismatch");
        s_requests[_requestId] = RequestStatus({
            randomWords: _randomWords,
            signer: signer,
            signature: _signature,
            exists: true,
            fulfilled: true
        });
        lastRequestId = _requestId;
        return _requestId; // requestID is a uint.
    }

    function getEthSignedMessageHash(bytes32 _messageHash)
        private  
        pure
        returns (bytes32)
    {
        /*
        Signature is produced by signing a keccak256 hash with the following format:
        "\x19Ethereum Signed Message\n" + len(msg) + msg
        */
        return keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash)
        );
    }

    function recoverSigner(
        bytes32 _ethSignedMessageHash,
        bytes memory _signature
    ) private pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);

        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(bytes memory sig)
        private 
        pure
        returns (bytes32 r, bytes32 s, uint8 v)
    {
        require(sig.length == 65, "invalid signature length");

        assembly {
            /*
            First 32 bytes stores the length of the signature

            add(sig, 32) = pointer of sig + 32
            effectively, skips first 32 bytes of signature

            mload(p) loads next 32 bytes starting at the memory address p into memory
            */

            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }

        // implicitly return (r, s, v)
    }

    function verify(
        uint256 _requestId,
        bytes memory _randomWords,
        // bytes memory _signature,
        address _signer
    ) public view returns (bool) {
        require(s_requests[_requestId].exists, "request not found");
        RequestStatus memory request = s_requests[_requestId];
        
        bytes32 messageHash = getMessageHash(_randomWords);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        if(recoverSigner(ethSignedMessageHash, request.signature) != _signer)
            return false;
        return keccak256(abi.encodePacked(_randomWords)) ==  keccak256(abi.encodePacked(request.randomWords));
    }

    // to check the request status of random number call.
    function getRequestStatus(
        uint256 _requestId
    ) public  view returns (bool fulfilled, bytes memory randomWords) {
        require(s_requests[_requestId].exists, "request not found");
        RequestStatus memory request = s_requests[_requestId];
        return (request.fulfilled, request.randomWords);
    }
}