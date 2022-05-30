import detectEthereumProvider from "@metamask/detect-provider"
import { Strategy, ZkIdentity } from "@zk-kit/identity"
import { generateMerkleProof, Semaphore } from "@zk-kit/protocols"
import Greeter from "artifacts/contracts/Greeters.sol/Greeters.json"
import {  providers, Contract, ethers, utils } from "ethers"
import Head from "next/head"
import React, { useEffect } from "react"
import styles from "../styles/Home.module.css"
import { TextField, Button } from "@mui/material"
import  { useFormik } from 'formik';
import * as Yup from 'yup';




export default function Home() {


    const [logs, setLogs] = React.useState("Connect your wallet and greet!")
    const [greeting, setGreeting] = React.useState("");

    useEffect(()=> {
        const listener = async () => {
            const contract = new Contract("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", Greeter.abi)
            const provider = new providers.JsonRpcProvider("http://localhost:8545")

            const contractOwner = contract.connect(provider.getSigner())

            contractOwner.on('NewGreeting', result => {
                setGreeting(`${utils.parseBytes32String(result)}`);
            })

          }
          listener()
    }, [])


    const formik = useFormik({
        initialValues: {
            email: "",
            address: "",
            name: ""
        },
        validationSchema: Yup.object({
            name: Yup.string().label('Full Name').required(),
            email: Yup.string().email().label('Email Address').required(),
            address: Yup.string().label('Address').required()
        }),
        onSubmit: function (_values) {
            console.log(_values);
        }
    })




    async function greet() {
        setLogs("Creating your Semaphore identity...")

        const provider = (await detectEthereumProvider()) as any

        await provider.request({ method: "eth_requestAccounts" })

        const ethersProvider = new providers.Web3Provider(provider)

        const signer = ethersProvider.getSigner()
        const message = await signer.signMessage("Sign this message to create your identity!")

        const identity = new ZkIdentity(Strategy.MESSAGE, message)
        const identityCommitment = identity.genIdentityCommitment()
        const identityCommitments = await (await fetch("./identityCommitments.json")).json()


        const merkleProof = generateMerkleProof(20, BigInt(0), identityCommitments, identityCommitment)

        setLogs("Creating your Semaphore proof...")

        const greeting = "Hello ZKU"

        const witness = Semaphore.genWitness(
            identity.getTrapdoor(),
            identity.getNullifier(),
            merkleProof,
            merkleProof.root,
            greeting
        )

        const { proof, publicSignals } = await Semaphore.genProof(witness, "./semaphore.wasm", "./semaphore_final.zkey")
        const solidityProof = Semaphore.packToSolidityProof(proof)

        const response = await fetch("/api/greet", {
            method: "POST",
            body: JSON.stringify({
                greeting,
                nullifierHash: publicSignals.nullifierHash,
                solidityProof: solidityProof
            })
        })

        if (response.status === 500) {
            const errorMessage = await response.text()

            setLogs(errorMessage)
        } else {
            setLogs("Your anonymous greeting is onchain :)")
        }
    }
    return (
        <div className={styles.container}>
            <Head>
                <title>Greetings</title>
                <meta name="description" content="A simple Next.js/Hardhat privacy application with Semaphore." />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className={styles.main}>
                <h1 className={styles.title}>Greetings</h1>

                <p className={styles.description}>A simple Next.js/Hardhat privacy application with Semaphore.</p>

                <div className={styles.logs}>{logs}</div>

                <TextField
                        disabled
                        style={{
                            background: 'white',
                            width: '30%',
                            borderRadius: '5px',
                            marginBottom: '20px',
                        }}
                        id="outlined-disabled"
                        color="success"
                        label="New Greeting"
                        value={greeting}
                        variant="filled"
                />

                <div onClick={() => greet()} className={styles.button}>
                    Greet
                </div>
            </main>


            <div className={styles.formContainer}>

                <div className={styles.contentWrapper}>
                    <h1>Tell us about you?🥺</h1>
                    <form className={styles.form} onSubmit={formik.handleSubmit}>
                        <TextField
                            required
                            label="Name"
                            name="name"
                            variant="filled"
                            size="small"
                            type="text"
                            onChange={formik.handleChange} 
                            onBlur={formik.handleBlur} 
                            value={formik.values.name}
                            error={formik.errors.name && formik.touched.name ? true : false}
                            helperText={formik.errors.name}
                        />
                        <TextField
                            required
                            name="email"
                            label="Email"
                            variant="filled"
                            size="small"
                            type="email"
                            onChange={formik.handleChange} 
                            onBlur={formik.handleBlur} 
                            value={formik.values.email}
                            error={formik.errors.email && formik.touched.email ? true : false}
                            helperText={formik.errors.email}
                        />
                        <TextField
                            required
                            name="address"
                            label="Address"
                            variant="filled"
                            size="small"
                            className={styles.largeInput}
                            multiline
                            rows={4}
                            onChange={formik.handleChange} 
                            onBlur={formik.handleBlur} 
                            value={formik.values.address}
                            error={formik.errors.address && formik.touched.address ? true : false}
                            helperText={formik.errors.address}
                        />

                        <div className={styles.buttonWrapper}>
                            <Button type="submit" className={styles.actionButton} variant="contained">Submit</Button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    )
}
