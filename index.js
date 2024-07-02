const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");

// Create a VPC
const vpc = new aws.ec2.Vpc("my-vpc", {
    cidrBlock: "10.0.0.0/16",
});

// Create an Internet Gateway
const igw = new aws.ec2.InternetGateway("my-igw", {
    vpcId: vpc.id,
});

// Create a Public Subnet
const publicSubnet = new aws.ec2.Subnet("my-public-subnet", {
    vpcId: vpc.id,
    cidrBlock: "10.0.1.0/24",
    mapPublicIpOnLaunch: true,
});

// Create a Route Table
const routeTable = new aws.ec2.RouteTable("my-route-table", {
    vpcId: vpc.id,
    routes: [
        {
            cidrBlock: "0.0.0.0/0",
            gatewayId: igw.id,
        },
    ],
});

// Associate the Route Table with the Public Subnet
new aws.ec2.RouteTableAssociation("my-route-table-association", {
    subnetId: publicSubnet.id,
    routeTableId: routeTable.id,
});

// Create Security Group
const securityGroup = new aws.ec2.SecurityGroup("web-secgrp", {
    vpcId: vpc.id,
    description: "Enable HTTP access",
    ingress: [
        {
            protocol: "tcp",
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ["0.0.0.0/0"],
        },
        {
            protocol: "tcp",
            fromPort: 22,
            toPort: 22,
            cidrBlocks: ["0.0.0.0/0"],
        },
    ],
    egress: [
        {
            protocol: "tcp",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
        },
    ],
});

// Create EC2 Instances
const size = "t3.small"; // Change as needed

// const ami = aws.ec2.getAmi({
//     filters: [
//         { name: "name", values: ["amzn2-ami-hvm-*-x86_64-gp2"] },
//     ],
//     owners: ["137112412989"], // Amazon
//     mostRecent: true,
// }).then(ami => ami.id);

const ami = "ami-04a81a99f5ec58529";

for (let i = 0; i < 2; i++) {
    new aws.ec2.Instance(`server-${i}`, {
        instanceType: size,
        ami: ami,
        subnetId: publicSubnet.id,
        securityGroups: [securityGroup.name],
    });
}
