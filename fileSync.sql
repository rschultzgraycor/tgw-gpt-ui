SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[fileSync](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[graphid] [nvarchar](200) NOT NULL,
	[filename] [nvarchar](255) NOT NULL,
	[filepath] [nvarchar](max) NOT NULL,
	[fileurl] [nvarchar](max) NOT NULL,
	[filesize] [int] NOT NULL,
	[createdDateTime] [datetime] NULL,
	[createdBy] [nvarchar](255) NULL,
	[lastModifiedDateTime] [datetime] NULL,
	[lastModifiedBy] [nvarchar](255) NULL,
	[isDeleted] [bit] NOT NULL,
	[syncStatus] [nvarchar](50) NULL,
	[chunkCount] [int] NULL,
	[ignoreFile] [bit] NOT NULL,
	[lastEmbeddedDateTime] [datetime] NULL,
	[agentId] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
ALTER TABLE [dbo].[fileSync] ADD  CONSTRAINT [DEFAULT_fileSync_ignoreFile]  DEFAULT ((0)) FOR [ignoreFile]
GO
