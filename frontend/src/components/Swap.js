import React, { useState } from "react";
import {
  CardContent,
  Grid,
  Typography,
} from "@mui/material";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import TokenButton from "./TokenButton";


function Swap() {

  return (
        <Grid container spacing={2} sx={{
          textAlign: "center",
          maxWidth: 450,
          backgroundColor: "#2a374e",
          margin: "auto",
          borderRadius: 8,
          padding: 2,
          marginTop: 2
        }}>
          <Grid item xs={12}>
            <Typography variant="h5" sx={{ color: "white" }}>
              Swap
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Card>
                <CardContent sx={{
                    backgroundColor: "#1f273a",
                    height: 60
                }}>
                  <Grid container spacing={2}>
                    <Grid item xs={2}>
                      <TokenButton text="ETH" imageSrc="/images/eth-logo.png"></TokenButton>
                    </Grid>
                    <Grid item xs={10}>
                      <Typography variant="h5" sx={{ color: "white", textAlign: "right" }}>0.000000</Typography>
                    </Grid>
                  </Grid>
                  
                </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
                <CardContent sx={{
                    backgroundColor: "#1f273a",
                    height: 60
                }}>
                  <Grid container spacing={2}>
                    <Grid item xs={2}>
                      <TokenButton text="MATIC" imageSrc="/images/matic-logo.png"></TokenButton>
                    </Grid>
                    <Grid item xs={10}>
                      <Typography variant="h5" sx={{ color: "white", textAlign: "right" }}>0.000000</Typography>
                    </Grid>
                  </Grid>
                  
                </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Button variant="outlined" sx={{ color: "white", backgroundColor: "#f3663a" }}>
              Swap
            </Button>
          </Grid>
        </Grid>
  );
}

export default Swap;
