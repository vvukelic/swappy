import React from "react";
import { Button, Typography } from "@mui/material";
import { ArrowDropDown } from "@mui/icons-material";


function TokenButton({ imageSrc, text, ...props }) {
    return (
        <Button variant="outlined" sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            textTransform: "none",
            borderRadius: 10,
            backgroundColor: "#2a374e"
        }}>
            <img 
                src={imageSrc}
                width="auto"
                height="32"
                sx={{
                    borderRadius: "50%",
                    marginRight: 1,
                    backgroundColor: "white"
                }}
            />
            <Typography sx={{
                color: "white",
                marginLeft: 1   
            }}>
                {text}
            </Typography>
            <ArrowDropDown></ArrowDropDown>
        </Button>
    );
}

export default TokenButton;
