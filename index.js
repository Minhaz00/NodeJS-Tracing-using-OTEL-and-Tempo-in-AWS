const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");

// Read the public key from environment variables (set by GitHub Actions)
const publicKey = process.env.PUBLIC_KEY;

// Create the EC2 KeyPair using the public key
const keyPair = new aws.ec2.KeyPair("my-key-pair", {
    keyName: "my-key-pair",
    publicKey: publicKey,
});

// Define the VPC and subnet configurations
const vpc = new aws.ec2.Vpc("my-vpc", {
    cidrBlock: "10.0.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
});

// Create Public Subnet
const publicSubnet = new aws.ec2.Subnet("public-subnet", {
    vpcId: vpc.id,
    cidrBlock: "10.0.1.0/24",
    mapPublicIpOnLaunch: true,
    availabilityZone: "ap-southeast-1a",
});

// Create Internet Gateway
const igw = new aws.ec2.InternetGateway("igw", {
    vpcId: vpc.id,
});

// Create Route Table
const routeTable = new aws.ec2.RouteTable("route-table", {
    vpcId: vpc.id,
    routes: [{
        cidrBlock: "0.0.0.0/0",
        gatewayId: igw.id,
    }],
});

// Associate Route Table with Public Subnet
new aws.ec2.RouteTableAssociation("rt-assoc-public", {
    subnetId: publicSubnet.id,
    routeTableId: routeTable.id,
});

// Create Security Group
const securityGroup = new aws.ec2.SecurityGroup("web-secgrp", {
    description: 'Enable SSH and K3s access',
    vpcId: vpc.id,
    ingress: [
        {
            protocol: "tcp",
            fromPort: 22,
            toPort: 22,
            cidrBlocks: ["0.0.0.0/0"],
        },
        {
            protocol: "tcp",
            fromPort: 6443,
            toPort: 6443,
            cidrBlocks: ["0.0.0.0/0"],
        },
    ],
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
    }],
});

// Create instances in the VPC and subnet
const amiId = "ami-04a81a99f5ec58529";    // Replace with a valid AMI ID for your region
const instanceType = "t3.small";


const server1 = new aws.ec2.Instance("server-1", {
    instanceType: instanceType,
    ami: amiId,
    subnetId: publicSubnet.id,
    keyName: keyPair.keyName,
    vpcSecurityGroupIds: [securityGroup.id],
    tags: {
        "Name": "server-1"
    }
});

const server2 = new aws.ec2.Instance("server-2", {
    instanceType: instanceType,
    ami: amiId,
    subnetId: publicSubnet.id,
    keyName: keyPair.keyName,
    vpcSecurityGroupIds: [securityGroup.id],
    tags: {
        "Name": "server-2"
    }
});

// Export outputs
exports.worker1PublicIp = server1.publicIp;
exports.worker2PublicIp = server2.publicIp;
