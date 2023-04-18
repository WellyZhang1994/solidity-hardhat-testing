const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WETH9", () => {

    let myContract;
    let owner, user1;
    let factory;

    beforeEach(async () =>
    {
        [owner, user1] = await ethers.getSigners();
        factory = await ethers.getContractFactory("WETH9");
        myContract = await factory.deploy();
    })

    it("#1 deposit should mint the token for user1 and the token amount must be equal to msg.value", async () =>
    {  
        const depositAmount = ethers.utils.parseEther("1");
        // Deposit funds from user1 account
        await myContract.connect(user1).deposit({ value: depositAmount });
        // Check user1 balance
        const balance = await myContract.balanceOf(user1.address);
        expect(balance).to.equal(depositAmount);
    })

    it("#2 send value to the contract address", async () =>
    {  
        const amount = ethers.utils.parseEther("1.0")
        const transactionHash = await user1.sendTransaction({
            to: myContract.address,
            value: amount, 
        });
        expect(transactionHash).to.changeEtherBalance(amount)
    })

    it("#3 should emit a Transfer event (deposit)", async () =>
    {  

        const depositAmount = ethers.utils.parseEther("1");
        const tx = await myContract.connect(user1).deposit({ value: depositAmount });

        // wait for the event to be emitted 
        const receipt = await tx.wait();
        // get the event object from the transaction receipt
        const event = receipt.events.find((e) => e.event === "Transfer");

        // check that the event was emitted
        expect(event).to.not.be.undefined;
    })

    it("#4 should burn the token when user call withdraw function", async () =>
    {  
        // need to deposit first
        const withdrawAmount = ethers.utils.parseEther("1");
        await myContract.connect(user1).deposit({ value: withdrawAmount });
        const initialBalance = await myContract.balanceOf(user1.address);

        // call the withdraw function
        await myContract.connect(user1).withdraw(withdrawAmount);
        const finalBalance = await myContract.balanceOf(user1.address);

        // check the finalBalance & initialBalance
        expect(finalBalance).to.equal(initialBalance - withdrawAmount);
    })

    it("#5 should return the ether when user call withdraw function", async () =>
    {  
        const mintAmount = ethers.utils.parseEther("1");
        await myContract.connect(user1).deposit({ value: mintAmount });

        const originalBalance = await user1.getBalance();
        //call the withdraw function
        const tx = await myContract.connect(user1).withdraw(mintAmount);
        const receipt = await tx.wait();
        const totalGasFee = receipt.cumulativeGasUsed * receipt.effectiveGasPrice
        const finalBalance = await user1.getBalance();

        //need to considerate the gasfee when user1 call the withdraw function
        expect(finalBalance).to.equal(originalBalance.add(mintAmount).sub(totalGasFee));
    })

    it("#6 should emit a Transfer event (withdraw)", async () =>
    {  
        //same as deposit function
        const depositAmount = ethers.utils.parseEther("1");
        await myContract.connect(user1).deposit({ value: depositAmount });
        const tx = await myContract.connect(user1).withdraw(depositAmount);
        const receipt = await tx.wait();

        const event = receipt.events.find((e) => e.event === "Transfer");
        expect(event).to.not.be.undefined;
    })

    it("#7 should transfer the token to other user", async () =>
    {
        const depositAmount = ethers.utils.parseEther("1");

        // owner deposit 1 ether to get the token
        await myContract.connect(owner).deposit({ value: depositAmount });

        // get the init balance of sender & receiver
        const initialSenderBalance = await myContract.balanceOf(owner.address);
        const initialReceiverBalance = await myContract.balanceOf(user1.address);
        const transferAmount = ethers.utils.parseEther("0.5");

        // call the transfer function
        await myContract.connect(owner).transfer(user1.address, transferAmount);

        const finalSenderBalance = await myContract.balanceOf(owner.address);
        const finalReceiverBalance = await myContract.balanceOf(user1.address);

        // Check that the sender's balance was reduced by the transfer amount
        expect(finalSenderBalance).to.equal(initialSenderBalance.sub(transferAmount));
        expect(finalReceiverBalance).to.equal(initialReceiverBalance.add(transferAmount));
    })

    it("#8 should approve someone to spend the token and check the allowance is correct", async () =>
    {
        const depositAmount = ethers.utils.parseEther("1");
        await myContract.deposit({ value: depositAmount });

        await myContract.connect(owner).approve(user1.address, depositAmount);
        const getAllowanceForSpender = await myContract.allowance(owner.address, user1.address);
        expect(getAllowanceForSpender).to.equal(depositAmount);
    })

    it("#9 should call transferFrom function by spender and check the allowance is available", async () =>
    {
        const depositAmount = ethers.utils.parseEther("1");
        await myContract.deposit({ value: depositAmount });
        await myContract.connect(owner).approve(user1.address, depositAmount);
        const tx = await myContract.connect(user1).transferFrom(owner.address, user1.address, depositAmount)
        //if the allowance is available for spender, the transaction might be success
        //to check the transaction is success
        expect(tx).to.have.property("hash");
        expect(tx).to.have.property("blockNumber");
    })

    it("#10 should call transferFrom function and check the allowance is 0", async () =>
    {
        const depositAmount = ethers.utils.parseEther("1");
        await myContract.deposit({ value: depositAmount });
        await myContract.connect(owner).approve(user1.address, depositAmount);
        await myContract.connect(user1).transferFrom(owner.address, user1.address, depositAmount)
        const getAllowanceAfterTransform = await myContract.allowance(owner.address, user1.address);
        // if the allowance value in [owner][user1] is 0, means the token is transferFrom function is completed
        expect(getAllowanceAfterTransform).to.equal(0);
    })

})